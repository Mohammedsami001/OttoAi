import {
  LayoutDashboard,
  Mail,
  FileText,
  CreditCard,
  Calendar,
  Settings,
  RefreshCcw,
  MousePointerClick,
  Plug,
  Activity,
  ChevronDown
} from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="w-full max-w-5xl mx-auto h-[550px] bg-[#F8FAFC] dark:bg-[#0B0F19] border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-left font-sans transform-gpu hover:scale-[1.02] transition-transform duration-500 text-[0.9rem]" style={{ zoom: 0.9 }}>
      
      {/* Sidebar */}
      <div className="w-full md:w-56 bg-[#F1F5F9] dark:bg-[#111827] border-r border-gray-200/60 dark:border-gray-800/60 flex flex-col justify-between hidden md:flex">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8 px-2 mt-2">
            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">OttoAi</span>
          </div>
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
            <NavItem icon={<Mail size={16} />} label="Gmail Summaries" />
            <NavItem icon={<FileText size={16} />} label="Google Docs" />
            <NavItem icon={<CreditCard size={16} />} label="Subscriptions" />
            <NavItem icon={<Calendar size={16} />} label="Bookings" />
            <NavItem icon={<Settings size={16} />} label="Settings" />
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-sm">
              J
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">John Doe</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Pro Plan</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 md:p-6 bg-white dark:bg-[#050505]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">A quick pulse of your productivity stack and Google workflow.</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm">
            <RefreshCcw size={12} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Grid 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatCard title="INBOX MESSAGES" value="15" icon={<Mail size={14} />} />
          <StatCard title="GOOGLE DOCS" value="12" icon={<FileText size={14} />} />
          <StatCard title="UPCOMING EVENTS" value="7" icon={<Calendar size={14} />} />
          <StatCard title="ACTIVE INTEGRATIONS" value="5" icon={<Plug size={14} />} />
        </div>

        {/* Stats Grid 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <StatCard title="PRODUCT TOUCHPOINTS" value="34" icon={<MousePointerClick size={14} />} />
          <StatCard title="CONNECTED APPS" value="5" icon={<Plug size={14} />} />
          <StatCard title="WORKFLOW SCORE" value="74" icon={<Activity size={14} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Daily Steps */}
            <div className="lg:col-span-1 border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-[#0f1115] shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} className="text-emerald-500" />
                    <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Daily Steps</h3>
                </div>
                <p className="text-[10px] text-gray-400 mb-4">7-day average</p>
                <div className="flex items-end gap-2 mb-6">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">0</span>
                    <span className="text-xs text-gray-400 pb-1">today</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div><span className="block mb-1">Total (7d)</span><span className="font-semibold text-gray-700 dark:text-gray-300">0</span></div>
                    <div><span className="block mb-1">Peak</span><span className="font-semibold text-gray-700 dark:text-gray-300">0</span></div>
                </div>
            </div>

            {/* Automation Index */}
            <div className="lg:col-span-2 border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-[#0f1115] flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Automation Index</h3>
                </div>
                <div className="flex-1 flex items-end gap-2 sm:gap-4 mt-auto pb-2 justify-between">
                    <Bar label="Gmail" height="h-6" />
                    <Bar label="Docs" height="h-4" />
                    <Bar label="Events" height="h-3" />
                    <Bar label="Integrations" height="h-2" />
                    <Bar label="Touchpoints" height="h-10" />
                    <Bar label="Score" height="h-16" />
                </div>
            </div>
        </div>

        {/* Integration Health */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-[#0f1115] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Activity size={14} className="text-emerald-500" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Integration Health</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <IntegrationItem name="Google Calendar" desc="Scheduling and conflict checks" status="On" />
                <IntegrationItem name="Google Meet" desc="Meeting links for bookings" status="On" />
                <IntegrationItem name="Gmail" desc="Inbox summaries and smart replies" status="On" />
                <IntegrationItem name="Google Docs" desc="AI-powered doc summaries" status="On" />
                <IntegrationItem name="Google Fit" desc="Daily steps and health metrics" status="On" />
            </div>
        </div>

      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${active ? 'bg-gray-200/50 dark:bg-gray-800/50 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:text-gray-200'}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 sm:p-4 bg-white dark:bg-[#0f1115] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function Bar({ label, height }) {
  return (
    <div className="flex flex-col items-center flex-1 group">
      <div className={`w-full bg-gray-200 dark:bg-gray-800 rounded-t-md group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400 transition-colors ${height}`}></div>
      <span className="text-[8px] sm:text-[9px] text-gray-400 mt-2 text-center truncate w-full px-1">{label}</span>
    </div>
  );
}

function IntegrationItem({ name, desc, status }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
      <div>
        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{name}</h4>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status === 'On' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
        {status}
      </div>
    </div>
  );
}
