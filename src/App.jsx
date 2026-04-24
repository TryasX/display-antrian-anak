import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [doctors, setDoctors] = useState([])
  const [tindakan, setTindakan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const PHOTO_BASE_URL = 'http://192.168.30.33:81/profil-dokter/img/'
  
  // Array warna pastel ceria
  const cardColors = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#9EE09E']

  // FUNGSI SAKTI: Nentuin warna permanen berdasarkan ID Dokter (RecordKey)
  const getDoctorColor = (recordKey) => {
    let hash = 0;
    const strKey = String(recordKey);
    for (let i = 0; i < strKey.length; i++) {
      hash += strKey.charCodeAt(i);
    }
    return cardColors[hash % cardColors.length];
  }

  const fetchAntrianData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/antrian-anak') 
      const rawData = response.data?.data

      if (!Array.isArray(rawData)) {
        setIsLoading(false)
        return
      }

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

      setDoctors(prevDocs => {
        if (prevDocs.length === 0 || prevDocs.length !== sortedDoctors.length) {
          return sortedDoctors
        }
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

  useEffect(() => {
    fetchAntrianData()
    const apiInterval = setInterval(() => fetchAntrianData(), 10000) 
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    
    document.body.style.margin = '0'
    document.body.style.background = 'linear-gradient(135deg, #E0F2FE 0%, #FEF08A 100%)' 
    document.body.style.overflow = 'hidden' 
    
    return () => {
      clearInterval(apiInterval)
      clearInterval(clockInterval)
    }
  }, [])

  useEffect(() => {
    if (doctors.length > 4) {
      const slideInterval = setInterval(() => {
        setDoctors(prevDocs => {
          const newArr = [...prevDocs]
          const firstItem = newArr.shift() 
          newArr.push(firstItem) 
          return newArr
        })
      }, 6000) 
      return () => clearInterval(slideInterval)
    }
  }, [doctors.length])

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#F59E0B' }}>
        <motion.h2 animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          🎈 Menyiapkan Ruang Bermain...
        </motion.h2>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      boxSizing: 'border-box',
      backgroundImage: `url('/bg-binatang.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)' }}></div>
      
      {/* HEADER */}
      <header style={{
        padding: '15px 40px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '6px dashed #FDE047', 
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        margin: '0 20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <motion.img 
            whileHover={{ rotate: 10, scale: 1.1 }}
            src="/logo.png" 
            alt="Logo RS" 
            style={{ height: '45px', objectFit: 'contain' }} 
          />
          <div style={{ borderLeft: '4px solid #38BDF8', paddingLeft: '15px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: '#0F172A', textShadow: '2px 2px 0px #FDE047' }}>
              POLIKLINIK ANAK
            </h1>
            <p style={{ margin: 0, color: '#F43F5E', fontWeight: '800', fontSize: '1rem' }}>Informasi Antrian Poliklinik Anak</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', color: '#0F172A' }}>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#F43F5E', textShadow: '2px 2px 0px #FECDD3' }}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p style={{ margin: 0, color: '#64748B', fontWeight: '800', fontSize: '1rem' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      {/* MARQUEE */}
      {tindakan && (
        <div style={{ margin: '15px 40px 0', backgroundColor: '#38BDF8', color: 'white', padding: '10px 30px', display: 'flex', gap: '20px', alignItems: 'center', borderRadius: '50px', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)', position: 'relative', zIndex: 9, border: '3px solid #FFFFFF' }}>
          <span style={{ backgroundColor: '#FDE047', color: '#0F172A', padding: '5px 20px', borderRadius: '30px', fontWeight: '900', fontSize: '1rem', whiteSpace: 'nowrap', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
            📢 PANGGILAN
          </span>
          <marquee scrollamount="8" style={{ fontSize: '1.2rem', fontWeight: '800' }}>
            Hore! Giliran Nomor Antrian <b style={{color: '#FDE047', fontSize: '1.4rem'}}>{tindakan.No}</b> ke dokter <b style={{color: '#FDE047'}}>{tindakan.NamaDokter}</b> di ruangan <b>{tindakan.NamaRuang}</b> ya!
          </marquee>
        </div>
      )}

      {/* AREA KARTU DOKTER */}
      <main style={{ 
        flex: 1, 
        padding: '20px 40px', 
        display: 'flex', 
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {doctors.length === 0 ? (
          <h2 style={{ color: '#64748B', width: '100%', textAlign: 'center', fontWeight: '800' }}>Belum ada dokter yang berjaga nih 💤</h2>
        ) : (
          <div style={{
            display: 'flex',
            gap: '25px', 
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <AnimatePresence mode="popLayout">
              {doctors.slice(0, 4).map((doc, index) => {
                // WARNA PERMANEN PER DOKTER
                const themeColor = getDoctorColor(doc.RecordKey)

                return (
                  <motion.div 
                    key={doc.RecordKey} 
                    layout 
                    initial={{ opacity: 0, x: 150, scale: 0.5, rotate: 15 }} 
                    animate={{ opacity: 1, x: 0, scale: 1, rotate: index % 2 === 0 ? -1 : 1 }} 
                    exit={{ opacity: 0, x: -150, scale: 0.5, rotate: -15, transition: { duration: 0.5 } }} 
                    transition={{ type: "spring", stiffness: 150, damping: 15 }} 
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '40px', 
                      boxShadow: `0 15px 35px rgba(0,0,0,0.1), 0 0 0 6px ${themeColor}`, 
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      width: 'calc(25% - 18.75px)', 
                      flexShrink: 0,
                      overflow: 'hidden' // KUNCI 1: Biar foto JPG yang ujungnya kotak kepotong ngikutin buletnya kartu
                    }}
                  >
                    {/* AREA FOTO DOKTER */}
                    <div style={{ 
                      position: 'relative', 
                      height: '240px', 
                      backgroundColor: themeColor, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      overflow: 'hidden' // Pengaman ekstra
                    }}>
                      <img 
                        src={`${PHOTO_BASE_URL}${doc.RecordKey}.jpg`} // KUNCI 2: Ganti ke JPG
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = "https://ui-avatars.com/api/?name=" + doc.NAMA_DOKTER + "&background=ffffff&color=0F172A&size=512&bold=true" 
                        }}
                        alt={doc.NAMA_DOKTER}
                        // KUNCI 3: objectFit cover biar JPG-nya penuh senada sama background kartu
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} 
                      />
                      
                      {/* BADGE ANTRIAN BULAT (Balon) */}
                      <motion.div 
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          backgroundColor: '#F43F5E', 
                          color: '#FFFFFF', 
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%', 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '3rem',
                          fontWeight: '900',
                          lineHeight: '1',
                          border: '4px solid #FFFFFF',
                          boxShadow: '0 8px 15px rgba(244, 63, 94, 0.4)'
                        }}
                      >
                        {doc.currentQueue}
                      </motion.div>
                    </div>

                    {/* AREA INFO TEKS */}
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#FFFFFF' // Pastiin text areanya tetep putih bersih
                    }}>
                      <h3 style={{ 
                        margin: '0 0 10px 0', 
                        fontSize: '1.1rem', 
                        fontWeight: '900', 
                        color: '#0F172A', 
                        // textTransform: 'uppercase',
                        lineHeight: '1.4',
                        minHeight: '2.8rem' 
                      }}>
                        {doc.NAMA_DOKTER}
                      </h3>

                      <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94A3B8', fontWeight: '900', letterSpacing: '1px' }}>
                          JAM PRAKTEK
                        </p>
                        <div style={{ 
                          display: 'inline-block', 
                          backgroundColor: '#F8FAFC', 
                          color: '#0F172A', 
                          border: `2px dashed ${themeColor}`, // Warna bordernya ngikutin warna tema dokternya
                          padding: '6px 20px', 
                          borderRadius: '20px', 
                          fontWeight: '900', 
                          fontSize: '1rem' 
                        }}>
                          {doc.JamPraktek}
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

    </div>
  )
}

export default App