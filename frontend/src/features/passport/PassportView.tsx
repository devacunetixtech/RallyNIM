import React from 'react';
import { User, Award, Flame, Compass } from 'lucide-react';

interface PassportViewProps {
  user: any;
  myPassport: any;
}

export const PassportView: React.FC<PassportViewProps> = ({
  user,
  myPassport,
}) => {
  return (
    <div className="glass-panel bg-gradient-to-br from-white/[0.02] to-white/[0.001] border border-white/5 rounded-2xl p-6 shadow-glass">
      
      {/* Passport Profile Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-5 mb-6 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nimiq-gold to-[#b8831b] flex items-center justify-center shrink-0">
          <User size={32} className="text-nimiq-dark" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Event Attendance Passport</h3>
          <p className="text-xs text-slate-400 font-mono select-all break-all max-w-lg mt-1">
            Wallet: {user?.walletAddress}
          </p>
        </div>
      </div>

      {/* Passport Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Award size={24} className="text-nimiq-gold mx-auto mb-2" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Rewards</div>
          <div className="text-xl font-extrabold text-nimiq-gold mt-1">
            {myPassport ? myPassport.totalNIMEarned : 0} NIM
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Flame size={24} className="text-[#e65100] mx-auto mb-2 animate-bounce" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Streak</div>
          <div className="text-xl font-extrabold text-[#e65100] mt-1">
            {myPassport ? myPassport.streak : 0} Check-ins
          </div>
        </div>

        <div className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-4 rounded-xl text-center transition-colors duration-150">
          <Compass size={24} className="text-sky-400 mx-auto mb-2" />
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Events Attended</div>
          <div className="text-xl font-extrabold text-slate-200 mt-1">
            {myPassport ? myPassport.eventsAttended.length : 0}
          </div>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Award size={15} className="text-nimiq-gold" />
          Earned Badges
        </h4>
        {myPassport && myPassport.badges && myPassport.badges.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {myPassport.badges.map((badge: string, i: number) => (
              <span key={i} className="text-xs font-bold text-nimiq-gold bg-nimiq-gold/10 border border-nimiq-gold/20 px-3.5 py-1.5 rounded-xl">
                🌟 {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Complete campaign stages to unlock specialized attendance badges.</p>
        )}
      </div>

      {/* Achievements Log */}
      <div>
        <h4 className="text-sm font-bold text-slate-200 mb-3">Activity Log</h4>
        {myPassport && myPassport.achievements && myPassport.achievements.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {myPassport.achievements.map((ach: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/[0.005] hover:bg-white/[0.01] border border-white/5 p-3 rounded-lg flex justify-between items-center transition-colors duration-150"
              >
                <div>
                  <div className="text-xs font-bold text-slate-300">{ach.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{ach.description}</div>
                </div>
                <div className="text-[10px] text-slate-600 font-medium font-mono shrink-0">
                  {new Date(ach.unlockedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No recent activity records.</p>
        )}
      </div>
    </div>
  );
};
