import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

async function api(url, opts = {}) {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
    const t = await res.text();
    if (!res.ok) throw new Error(t);
    return t ? JSON.parse(t) : null;
}

export default function App() {
    const [items, setItems] = useState([]);
    const [foods, setFoods] = useState([]);
    const [selected, setSelected] = useState(null);
    const [newItem, setNewItem] = useState({ name: "", proteinPct: 0, fatPct: 0, carbsPct: 0 });
    const [newFood, setNewFood] = useState("");
    const [newComp, setNewComp] = useState({ foodItemId: 0, quantityGrams: 0 });
    const [macros, setMacros] = useState(null);
    const [scale, setScale] = useState(5000);

    const loadAll = async () => {
        const f = await api("/api/salat/foods"); setFoods(f);
        const i = await api("/api/salat/fooditems"); setItems(i);
    };

    useEffect(() => { loadAll(); }, []);
    const selectedFood = useMemo(() => foods.find(f => f.id === selected) || null, [foods, selected]);

    async function addItem() {
        if (!newItem.name.trim()) return alert("Palun sisesta toiduaine nimi!");
        if (Number(newItem.proteinPct) + Number(newItem.fatPct) + Number(newItem.carbsPct) > 100)
            return alert("Protsentide summa ei tohi ületada 100%");
        await api("/api/salat/fooditem", { method: "POST", body: JSON.stringify(newItem) });
        setNewItem({ name: "", proteinPct: 0, fatPct: 0, carbsPct: 0 }); await loadAll();
    }

    async function addFood() {
        if (!newFood.trim()) return alert("Palun sisesta toidu nimi!");
        try {
            const f = await api("/api/salat/food", {
                method: "POST",
                body: JSON.stringify({ name: newFood })
            });
            setNewFood("");
            await loadAll();
            setSelected(f.id);
        } catch (e) {
            if (String(e.message).includes("already exists") || String(e.message).includes("Conflict"))
                alert("Sellise nimega toit on juba olemas.");
            else alert(e.message);
        }
    }


    async function addComponent() {
        if (!selected) return alert("Vali toit!");
        if (!newComp.foodItemId || !newComp.quantityGrams) return alert("Vali toiduaine ja kogus!");
        await api(`/api/salat/food/${selected}/component`, { method: "POST", body: JSON.stringify(newComp) });
        await loadAll();
    }

    async function showMacros() {
        if (!selected) return;
        setMacros(await api(`/api/salat/food/${selected}/macros?scale=${scale}`));
    }

    return (
        <div className="app">
            <h1 className="h1">Kartulisalati rakendus <span className="badge">React + .NET API</span></h1>

            <div className="grid">
                {/* левая колонка */}
                <div className="card">
                    <h2 className="h2">Lisa toiduaine</h2>

                    <div className="row row--labels">
                        <div className="field">
                            <label>Nimi</label>
                            <input
                                placeholder="nt. Kartul"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>

                        <div className="field">
                            <label>Valk (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="2.5"
                                value={newItem.proteinPct}
                                onChange={e => setNewItem({ ...newItem, proteinPct: +e.target.value })}
                            />
                            <small>Valgud (proteiinid)</small>
                        </div>

                        <div className="field">
                            <label>Rasv (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.1"
                                value={newItem.fatPct}
                                onChange={e => setNewItem({ ...newItem, fatPct: +e.target.value })}
                            />
                            <small>Rasvad</small>
                        </div>

                        <div className="field">
                            <label>Süsivesik (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="17.0"
                                value={newItem.carbsPct}
                                onChange={e => setNewItem({ ...newItem, carbsPct: +e.target.value })}
                            />
                            <small>Süsivesikud</small>
                        </div>

                        <div className="field">
                            <label>&nbsp;</label>
                            <button onClick={addItem}>Lisa</button>
                        </div>
                    </div>

                    <div className="sub">Summa ≤ 100%</div>

                </div>

                <div className="card">
                    <h2 className="h2">Loo toit</h2>
                    <div className="row--inline">
                        <input placeholder="Toidu nimi" value={newFood} onChange={e => setNewFood(e.target.value)} />
                        <button onClick={addFood}>Loo</button>
                    </div>
                </div>

                {/* правая колонка (занимает всю ширину на мобильном) */}
                <div className="card" style={{ gridColumn: "1 / -1" }}>
                    <h2 className="h2">Toidud</h2>
                    <div className="row--inline">
                        <select value={selected ?? ""} onChange={e => setSelected(+e.target.value)} style={{ minWidth: 240 }}>
                            <option value="">— vali —</option>
                            {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>

                    {selectedFood && (
                        <>
                            <h3 className="h3">Komponendid</h3>
                            <ul className="list">
                                {selectedFood.components.map(c => (
                                    <li key={c.id}>
                                        <span>{c.foodItem?.name}</span>
                                        <strong>{c.quantityGrams} g</strong>
                                    </li>
                                ))}
                            </ul>

                            <h3 className="h3">Lisa komponent</h3>
                            <div className="comp-row">
                                <select value={newComp.foodItemId} onChange={e => setNewComp({ ...newComp, foodItemId: +e.target.value })}>
                                    <option value="0">— vali toiduaine —</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <input type="number" placeholder="kogus g" value={newComp.quantityGrams}
                                    onChange={e => setNewComp({ ...newComp, quantityGrams: +e.target.value })} />
                                <button onClick={addComponent}>Lisa</button>
                            </div>

                            <div className="row--inline mtop">
                                <input type="number" value={scale} onChange={e => setScale(+e.target.value)} />
                                <button onClick={showMacros}>Näita makrosid</button>
                            </div>

                            {macros && (
                                <pre className="pre">{JSON.stringify(macros, null, 2)}</pre>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
