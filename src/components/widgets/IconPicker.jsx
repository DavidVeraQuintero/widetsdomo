import { useState } from 'react';
import { ICONS, ICON_CATEGORIES } from './iconLibrary';
import SvgIcon from './SvgIcon';

export default function IconPicker({ currentId, onChange, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(Object.keys(ICON_CATEGORIES)[0]);

  const categories = Object.keys(ICON_CATEGORIES);
  const icons = search.trim()
    ? Object.keys(ICONS).filter(id => id.includes(search.toLowerCase()))
    : ICON_CATEGORIES[activeCategory] || [];

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:2100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:'2px solid #1e3a5f', borderRadius:16, padding:18, width:320, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:13 }}>Elegir icono</span>
          <button className="w-btn" style={{ padding:'2px 8px', fontSize:11 }} onMouseDown={e=>e.stopPropagation()} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <input
          style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#e2e8f0', fontSize:12, padding:'6px 10px', marginBottom:10, outline:'none', width:'100%', boxSizing:'border-box' }}
          placeholder="Buscar icono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onMouseDown={e => e.stopPropagation()}
        />

        {/* Category tabs */}
        {!search.trim() && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
            {categories.map(cat => (
              <button key={cat} onMouseDown={e=>e.stopPropagation()}
                onClick={() => setActiveCategory(cat)}
                style={{ background: activeCategory===cat ? '#1d4ed8' : '#1e293b', border:'1px solid', borderColor: activeCategory===cat ? '#3b82f6' : '#334155', borderRadius:6, color: activeCategory===cat ? '#93c5fd' : '#64748b', fontSize:10, padding:'3px 8px', cursor:'pointer' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Icon grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, overflowY:'auto', flex:1 }}>
          {icons.map(id => (
            <div key={id} title={id}
              style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background: id===currentId ? '#1d4ed8' : '#1e293b', border:'1px solid', borderColor: id===currentId ? '#3b82f6' : 'transparent', cursor:'pointer', transition:'background .15s' }}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { onChange(id); onClose(); }}
            >
              <SvgIcon id={id} size={18} color={id===currentId ? '#60a5fa' : 'var(--text-secondary)'} />
            </div>
          ))}
          {icons.length === 0 && (
            <div style={{ gridColumn:'span 7', textAlign:'center', color:'#475569', fontSize:12, padding:'16px 0' }}>Sin resultados</div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:10, fontSize:10, color:'rgba(255,255,255,0.2)' }}>Clic fuera para cerrar</div>
      </div>
    </div>
  );
}
