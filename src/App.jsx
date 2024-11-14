import { createSignal } from "solid-js"
import { createDexieArrayQuery } from "solid-dexie";
import { Dexie } from "dexie";

const [currency, setCurrency] = createSignal('CZK')

const CURRENCIES = {
    CZK: 1,
    EUR: 25.5,
    USD: 21.5
}

export default function App() {

    const db = new Dexie("ExpenseTracking")
    db.version(1).stores({
        data: "++id,description,amount,currency,type",
    })

    const incomes = createDexieArrayQuery(() => db.data.where('type').equals('income').toArray())
    const expenses = createDexieArrayQuery(() => db.data.where('type').equals('expense').toArray())
    console.log(incomes, expenses)
    const balance = () => 
            incomes.reduce((acc, b) => acc + b.amount * CURRENCIES[b.currency] / CURRENCIES[currency()], 0) + 
            expenses.reduce((acc, b) => acc + b.amount * CURRENCIES[b.currency] / CURRENCIES[currency()], 0)
    
    let dialog
    const showModal = () => {
        dialog.showModal()
    }

    const onCloseDialog = (e, cancel = false) => {
        if(cancel) return dialog.close()
        e.preventDefault()

        const data = new FormData(e.target).entries().reduce((acc, [key, value]) => ({...acc, [key]: value}), {})
        if(!data.description || !data.amount) return dialog.close()
            
        data.amount = parseFloat(data.amount)
        db.data.add({
            ...data,
            type: data.amount > 0 ? 'income' : 'expense'
        })

        e.target.reset()
        dialog.close()
    }


    const deleteLine = (id) => {
        console.log(id)
        db.data.delete(id)
    }


    return <main className="container mx-auto text-center m-16">
        <h1>Expense Tracking</h1>
        
        <div class="my-10">
            <h2>Balance</h2>
            <p id="balance">{balance().toFixed(2)} <span id="currency">{currency()}</span></p>
        </div>


        <div class="flex flex-row justify-evenly">
            <section>
                <h2>Outcome</h2>
                <div class="list">
                    {expenses.map((o, i) => <Line key={i} type="outcome" data={o} deleteLine={deleteLine}/>)}
                </div>
            </section>

            <div class="flex flex-col gap-3 items-stretch">
                <button onClick={showModal}>Add</button>
                {/* <button onClick={() => _}>Delete</button> */}
                <CurrencySelector onChange={(e) => setCurrency(e.target.value)}/>
            </div>

            <section>
                <h2>Income</h2>
                <div class="list">
                    {incomes.map((o, i) => <Line key={i} type="income" data={o} deleteLine={deleteLine}/>)}
                </div>
            </section>
        </div>
        <AddDialog ref={dialog} onClose={onCloseDialog}/>
    </main>
}

function CurrencySelector(props) {
    return <select onChange={props.onChange}>
        {Object.keys(CURRENCIES).map(c => <option value={c}>{c}</option>)}
    </select>
}

function Line(props) {
    return <div key={props.key} class={`item ${props.type}`} onClick={e => props.deleteLine(props.data.id)}>
        <span>{props.data.description}</span>
        <span class="amount">{props.data.amount.toFixed(2)} <span>{props.data.currency}</span></span>
    </div>
}

function AddDialog(props) {

    return <dialog ref={props.ref} class="rounded-lg p-5 backdrop:opacity-75 backdrop:bg-black">
        <h2>New item</h2>
        <form method="dialog" class="flex flex-col gap-2" onSubmit={props.onClose}>
            <input type="text" name="description" placeholder="Description" autofocus/>
            <input type="number" name="amount" placeholder="Amount"/>
            <CurrencySelector />

            <button type="submit">Submit</button>
            <button class="bg-red-500" type="reset" onClick={(e) => props.onClose(e, true)}>Cancel</button>
        </form>
    </dialog>
}