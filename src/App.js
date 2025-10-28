import React, { useEffect, useState, useMemo } from "react";

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
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
  const foods = await api("/api/salat/foods");
  setFoods(foods);

  const items = await api("/api/salat/fooditems");
  setItems(items);
};


  useEffect(() => { loadAll(); }, []);
  const selectedFood = useMemo(() => foods.find(f => f.id === selected) || null, [foods, selected]);

  async function addItem() {
    if (!newItem.name.trim()) { alert("Palun sisesta toiduaine nimi!"); return; }
    if (Number(newItem.proteinPct)+Number(newItem.fatPct)+Number(newItem.carbsPct) > 100) {
      alert("Protsentide summa ei tohi ületada 100%"); return;
    }
    await api("/api/salat/fooditem", { method: "POST", body: JSON.stringify(newItem) });
    setNewItem({ name:"", proteinPct:0, fatPct:0, carbsPct:0 });
    await loadAll(); 
  }


  async function addFood() {
    const f = await api("/api/salat/food", { method: "POST", body: JSON.stringify({ name: newFood }) });
    setNewFood("");
    await loadAll();
    setSelected(f.id);
  }

  async function addComponent() {
    await api(`/api/salat/food/${selected}/component`, {
      method: "POST",
      body: JSON.stringify(newComp),
    });
    await loadAll();
  }

  async function showMacros() {
    setMacros(await api(`/api/salat/food/${selected}/macros?scale=${scale}`));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", fontFamily: "Segoe UI, sans-serif" }}>
      <h1>Kartulisalati rakendus (React + .NET API)</h1>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2>Lisa toiduaine</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px", gap: 8 }}>
          <input placeholder="Nimi" value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <input type="number" placeholder="Valk %" value={newItem.proteinPct} onChange={e => setNewItem({...newItem, proteinPct:+e.target.value})}/>
          <input type="number" placeholder="Rasv %" value={newItem.fatPct} onChange={e => setNewItem({...newItem, fatPct:+e.target.value})}/>
          <input type="number" placeholder="Süsivesik %" value={newItem.carbsPct} onChange={e => setNewItem({...newItem, carbsPct:+e.target.value})}/>
          <button onClick={addItem}>Lisa</button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2>Loo toit</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Toidu nimi" value={newFood} onChange={e => setNewFood(e.target.value)} />
          <button onClick={addFood}>Loo</button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2>Toidud</h2>
        <select value={selected ?? ""} onChange={e => setSelected(+e.target.value)} style={{ minWidth: 200 }}>
          <option value="">— vali —</option>
          {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        {selectedFood && (
          <>
            <h3>Komponendid</h3>
            <ul>
              {selectedFood.components.map(c => (
                <li key={c.id}>{c.foodItem?.name} — {c.quantityGrams} g</li>
              ))}
            </ul>

            <h4>Lisa komponent</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={newComp.foodItemId} onChange={e => setNewComp({...newComp, foodItemId:+e.target.value})}>
                <option value="0">— vali toiduaine —</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input type="number" placeholder="kogus g" value={newComp.quantityGrams} onChange={e => setNewComp({...newComp, quantityGrams:+e.target.value})}/>
              <button onClick={addComponent}>Lisa</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <input type="number" value={scale} onChange={e => setScale(+e.target.value)} />
              <button onClick={showMacros}>Näita makrosid</button>
            </div>

            {macros && (
              <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
                {JSON.stringify(macros, null, 2)}
              </pre>
            )}
          </>
        )}
      </section>
    </div>
  );
}
