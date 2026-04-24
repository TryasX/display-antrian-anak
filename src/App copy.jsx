import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [doctors, setDoctors] = useState([])
  const [tindakan, setTindakan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const PHOTO_BASE_URL = 'http://192.168.30.33:81/profil-dokter/img/'

  const fetchAntrianData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/antrian-anak') 
      const rawData = response.data?.data

      if (!Array.isArray(rawData)) {
        setIsLoading(false)
        return
      }

      // 1. GROUPING & SORTING TETAP AMAN DENGAN MAP
      const docMap = new Map()
      rawData.forEach(curr => {
        const currentNo = parseInt(curr.NoAntrian) || 0
        if (!docMap.has(curr.RecordKey)) {
          docMap.set(curr.RecordKey, { ...curr, currentQueue: currentNo })
        } else {
          const existing = docMap.get(curr.RecordKey)
          if (currentNo > existing.currentQueue) existing.currentQueue = currentNo
        }
      })
      const sortedDoctors = Array.from(docMap.values())

      // 2. SMART UPDATE: Biar carousel nggak balik ke awal pas API refresh
      setDoctors(prevDocs => {
        // Kalau pertama kali load, atau jumlah dokter berubah (ada yg login/logout)
        if (prevDocs.length === 0 || prevDocs.length !== sortedDoctors.length) {
          return sortedDoctors
        }
        
        // Kalau dokternya sama, KITA CUMA UPDATE ANGKA ANTRIANNYA AJA
        // Urutan array tetep dipertahankan biar carousel jalan terus
        return prevDocs.map(oldDoc => {
          const updatedDoc = sortedDoctors.find(d => d.RecordKey === oldDoc.RecordKey)
          return updatedDoc ? { ...oldDoc, currentQueue: updatedDoc.currentQueue } : oldDoc
        })
      })

      setIsLoading(false)
    } catch (error) {
      console.error("Gagal narik data antrian:", error)
      setIsLoading(false)
    }
  }

  // EFEK 1: Auto Refresh API Tiap 10 Detik
  useEffect(() => {
    fetchAntrianData()
    const apiInterval = setInterval(() => fetchAntrianData(), 10000) 
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    
    document.body.style.margin = '0'
    document.body.style.backgroundColor = '#F8FAFC' 
    document.body.style.overflow = 'hidden' 
    
    return () => {
      clearInterval(apiInterval)
      clearInterval(clockInterval)
    }
  }, [])

  // EFEK 2: ANIMASI CAROUSEL (Geser 1-per-1 tiap 6 detik)
  useEffect(() => {
    // Cuma geser kalau dokternya lebih dari 4 (kalau 4 ya diem aja nampil semua)
    if (doctors.length > 4) {
      const slideInterval = setInterval(() => {
        setDoctors(prevDocs => {
          const newArr = [...prevDocs]
          const firstItem = newArr.shift() // Cabut dokter yg paling kiri
          newArr.push(firstItem) // Lempar ke antrian paling kanan (Looping)
          return newArr
        })
      }, 6000) // Geser setiap 6 detik
      return () => clearInterval(slideInterval)
    }
  }, [doctors.length]) // Cuma re-run kalau jumlah dokter berubah

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1E3A8A' }}>
        <motion.h2 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          Menyiapkan Layar Antrian...
        </motion.h2>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      boxSizing: 'border-box',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      
      {/* HEADER STATIC */}
      <header style={{
        padding: '15px 40px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src="logo.png" alt="Logo RS" style={{ height: '45px', objectFit: 'contain' }} />
          <div style={{ borderLeft: '3px solid #FACC15', paddingLeft: '15px' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#1E3A8A' }}>POLIKLINIK ANAK</h1>
            <p style={{ margin: 0, color: '#64748B', fontWeight: '600', fontSize: '0.9rem' }}>Antrian Poliklinik Anak</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', color: '#1E3A8A' }}>
          <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p style={{ margin: 0, color: '#64748B', fontWeight: '600', fontSize: '0.9rem' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      {/* MARQUEE PANGGILAN TINDAKAN */}
      {tindakan && (
        <div style={{ backgroundColor: '#1E3A8A', color: 'white', padding: '8px 40px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative', zIndex: 9 }}>
          <span style={{ backgroundColor: '#FACC15', color: '#1E3A8A', padding: '5px 15px', borderRadius: '20px', fontWeight: '900', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            PANGGILAN TINDAKAN
          </span>
          <marquee scrollamount="8" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
            Nomor Antrian <b>{tindakan.No}</b> atas nama dokter <b>{tindakan.NamaDokter}</b> harap menuju ke <b>{tindakan.NamaRuang}</b>
          </marquee>
        </div>
      )}

      {/* AREA KARTU DOKTER (CAROUSEL LOOPING) */}
      <main style={{ 
        flex: 1, 
        padding: '20px 40px', 
        display: 'flex', 
        alignItems: 'center',
        overflow: 'hidden' // Kunci biar kartu yang geser ke kiri nggak jebol layar
      }}>
        {doctors.length === 0 ? (
          <h2 style={{ color: '#64748B', width: '100%', textAlign: 'center' }}>Belum ada antrian dokter saat ini.</h2>
        ) : (
          <div style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {/* mode="popLayout" bikin kartu yang keluar ngilang dengan mulus tanpa ngerusak flexbox */}
            <AnimatePresence mode="popLayout">
              {/* Kita ambil cuma 4 dokter teratas di array untuk ditampilin */}
              {doctors.slice(0, 4).map((doc) => (
                <motion.div 
                  key={doc.RecordKey} // Wajib pake RecordKey biar Framer Motion tau ini kartu yang mana
                  layout // Ini yang bikin efek geser mulus banget!
                  initial={{ opacity: 0, x: 100, scale: 0.9 }} // Muncul dari kanan
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.4 } }} // Keluar ke kiri
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '1px solid rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    // Rumus hitungan fix: 100% dibagi 4 kartu, dikurangin jarak gap-nya (3 gap * 20px / 4)
                    width: 'calc(25% - 15px)',
                    flexShrink: 0 // Biar kartunya nggak gepeng pas lagi transisi animasi
                  }}
                >
                  {/* AREA FOTO DOKTER */}
                  <div style={{ position: 'relative', height: '240px', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: '15px' }}>
                    <img 
                      src={`${PHOTO_BASE_URL}${doc.RecordKey}.jpg`} 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = "https://ui-avatars.com/api/?name=" + doc.NAMA_DOKTER + "&background=E2E8F0&color=1E3A8A&size=512" 
                      }}
                      alt={doc.NAMA_DOKTER}
                      style={{ width: '85%', height: '100%', objectFit: 'contain', objectPosition: 'bottom' }} 
                    />
                    
                    {/* BADGE KUNING NOMOR ANTRIAN */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#FACC15', 
                      color: '#0F172A', 
                      padding: '10px 25px', 
                      borderTopLeftRadius: '20px', 
                      fontSize: '3rem',
                      fontWeight: '900',
                      lineHeight: '1',
                      boxShadow: '-4px -4px 10px rgba(0,0,0,0.05)'
                    }}>
                      {doc.currentQueue}
                    </div>
                  </div>

                  {/* AREA INFO TEKS */}
                  <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '1rem', 
                      fontWeight: '900', 
                      color: '#1E3A8A', 
                      // textTransform: 'uppercase',
                      lineHeight: '1.4',
                      minHeight: '2.8rem' 
                    }}>
                      {doc.NAMA_DOKTER}
                    </h3>

                    <div>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.7rem', color: '#94A3B8', fontWeight: '800', letterSpacing: '1px' }}>
                        JAM PRAKTEK
                      </p>
                      <div style={{ display: 'inline-block', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '5px 15px', borderRadius: '15px', fontWeight: '800', fontSize: '1rem' }}>
                        {doc.JamPraktek}
                      </div>
                    </div>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FOOTER INFORMASI TAMBAHAN */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '15px', display: 'flex', justifyContent: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
        {/* <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700' }}>
          {doctors.length > 4 ? `Menampilkan ${doctors.length} Dokter Aktif` : ''}
        </p> */}
      </footer>

    </div>
  )
}

export default App