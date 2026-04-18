'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Check, Calendar, Video, Mail, FileText, ArrowRight } from 'lucide-react'

export default function GettingStarted() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]) // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri

  const dayMap = [
    { id: 1, label: 'M' },
    { id: 2, label: 'T' },
    { id: 3, label: 'W' },
    { id: 4, label: 'T' },
    { id: 5, label: 'F' },
    { id: 6, label: 'S' },
    { id: 7, label: 'S' }
  ]
  const [startHour, setStartHour] = useState('09:00')
  const [endHour, setEndHour] = useState('17:00')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (!fullName) setFullName(session?.user?.name || '')
      // Check if user already onboarded
      fetch('/api/user/onboarded')
        .then(r => r.json())
        .then(data => {
          if (data.onboarded) router.replace('/dashboard')
        })
        .catch(() => {})
    }
  }, [status, router, session])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const handleContinue = async () => {
    setIsSaving(true)
    try {
      if (step === 1) {
        if (fullName) {
          await fetch('/api/user/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fullName })
          })
        }
        setStep(2)
      } else if (step === 2) {
        setStep(3)
      } else if (step === 3) {
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            working_hours: { days: workDays, start: startHour, end: endHour },
            timezone: timezone,
            onboarded: true
          })
        })
        router.push('/dashboard')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDay = (dayId) => {
    if (workDays.includes(dayId)) {
      setWorkDays(workDays.filter(d => d !== dayId))
    } else {
      setWorkDays([...workDays, dayId])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-xs font-bold font-mono">1</div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-black' : 'bg-gray-200'} rounded-full transition-colors`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'} text-xs font-bold font-mono transition-colors`}>2</div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-black' : 'bg-gray-200'} rounded-full transition-colors`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'} text-xs font-bold font-mono transition-colors`}>3</div>
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to OttoAi, {session?.user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-500 mb-8">We just need some basic info to get your profile setup. You'll be able to edit this later.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm px-4 py-2 border outline-none focus:border-black text-gray-900" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Connected Apps</h1>
              <p className="text-gray-500 mb-8">Because you signed in with Google, we've automatically connected your tools to save you time.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                   <div className="flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-green-700" />
                     <span className="font-semibold text-green-900">Google Calendar</span>
                   </div>
                   <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3"/> Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                   <div className="flex items-center gap-3">
                     <Video className="w-5 h-5 text-green-700" />
                     <span className="font-semibold text-green-900">Google Meet</span>
                   </div>
                   <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3"/> Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                   <div className="flex items-center gap-3">
                     <Mail className="w-5 h-5 text-green-700" />
                     <span className="font-semibold text-green-900">Gmail Intelligence</span>
                   </div>
                   <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3"/> Connected</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               <h1 className="text-3xl font-bold text-gray-900 mb-2">Set your availability</h1>
               <p className="text-gray-500 mb-8">Let us know when you're typically open for meetings.</p>
               
               <div className="border border-gray-200 rounded-lg p-6">
                 <div className="flex items-center justify-between mb-6">
                    <span className="font-semibold">Default Hours</span>
                    <span className="text-sm text-gray-500 border border-gray-200 px-2 py-1 rounded">{timezone}</span>
                 </div>
                 <div className="flex gap-2">
                     {dayMap.map((day) => {
                      const isActive = workDays.includes(day.id)
                      return (
                        <button 
                          key={day.id} 
                          onClick={() => toggleDay(day.id)}
                          className={`w-10 h-10 border rounded flex items-center justify-center font-medium transition-colors ${isActive ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 bg-white text-gray-400 opacity-50'}`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                 </div>
                 <div className="mt-4 flex items-center gap-4 text-sm text-gray-700 font-medium">
                   <div className="flex-1">
                     <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} className="w-full border border-gray-300 outline-none rounded-md p-2 bg-white text-center" />
                   </div>
                   <span>-</span>
                   <div className="flex-1">
                     <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} className="w-full border border-gray-300 outline-none rounded-md p-2 bg-white text-center" />
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center">
           {step > 1 ? (
             <button disabled={isSaving} onClick={() => setStep(step - 1)} className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-4 py-2 disabled:opacity-50">Back</button>
           ) : <div></div>}
           <button disabled={isSaving} onClick={handleContinue} className="bg-black disabled:opacity-75 disabled:cursor-wait text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
              {isSaving ? "Saving..." : (step === 3 ? "Finish" : "Continue")}
              {!isSaving && step !== 3 && <ArrowRight className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </div>
  )
}
