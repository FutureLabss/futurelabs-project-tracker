// "use client";

// import {
//   CalendarDays,
//   ChevronDown,
//   ChevronLeft,
//   FastForward,
//   RotateCcw,
// } from "lucide-react";

// export default function MemberTopHeader() {
//   return (
//     <header className="h-[72px] w-full border-b border-slate-200 bg-white">
//       <div className="flex h-full items-center justify-between px-4 lg:px-7">
//         {/* LEFT — BRAND */}
//         <div className="flex min-w-fit items-center gap-2">
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="text-[21px] font-extrabold tracking-[-0.7px] text-[#079b72]">
//                 FutureLabs
//               </span>

//               <span className="text-[21px] font-medium tracking-[-0.5px] text-slate-900">
//                 Project Tracker
//               </span>
//             </div>

//             <p className="mt-[-1px] text-[11px] font-medium tracking-[0.7px] text-slate-500">
//               AUTOMATED INTELLIGENCE &amp; EXECUTION ENGINE
//             </p>
//           </div>
//         </div>

//         {/* CENTER — TIME MACHINE */}
//         <div className="hidden items-center gap-2 rounded-[11px] border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.10)] xl:flex">
//           {/* Calendar / Label */}
//           <div className="flex items-center gap-2 pr-2">
//             <CalendarDays
//               size={19}
//               strokeWidth={1.8}
//               className="text-[#08aa7c]"
//             />

//             <span className="text-[13px] font-semibold text-slate-500">
//               TIME MACHINE:
//             </span>

//             <span className="text-[13px] font-bold text-[#078765]">
//               Sun, Oct 18, 2026
//             </span>
//           </div>

//           {/* Previous */}
//           <button
//             type="button"
//             className="flex h-[29px] w-[29px] items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100"
//           >
//             <ChevronLeft size={17} />
//           </button>

//           {/* +1 Day */}
//           <button
//             type="button"
//             className="flex h-[31px] items-center gap-1 rounded-[8px] bg-[#e7f8f3] px-3 text-[12px] font-semibold text-[#079b72] transition hover:bg-[#d9f3eb]"
//           >
//             +1 Day
//             <ChevronDown size={13} className="rotate-[-90deg]" />
//           </button>

//           {/* +1 Week */}
//           <button
//             type="button"
//             className="flex h-[31px] items-center gap-1 rounded-[8px] bg-[#e7f8f3] px-3 text-[12px] font-semibold text-[#079b72] transition hover:bg-[#d9f3eb]"
//           >
//             +1 Week
//             <FastForward size={13} />
//           </button>

//           {/* Date Input */}
//           <input
//             type="text"
//             defaultValue="2026-10-18"
//             className="h-[35px] w-[155px] rounded-[9px] border border-slate-300 px-3 text-[13px] font-medium text-slate-700 outline-none focus:border-[#0bb386]"
//           />

//           {/* Reset */}
//           <button
//             type="button"
//             className="flex h-[35px] items-center gap-2 rounded-[9px] border border-[#ff5a5a] px-3 text-[12px] font-semibold text-[#ff4141] transition hover:bg-red-50"
//           >
//             <RotateCcw size={14} />
//             Reset Seed
//           </button>
//         </div>

//         {/* RIGHT — USER */}
//         <div className="flex min-w-fit items-center gap-3">
//           {/* Avatar */}
//           <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#eaf5ff] text-[12px] font-bold text-[#2187dd]">
//             AC
//           </div>

//           {/* User Select */}
//           <div className="relative hidden sm:block">
//             <select
//               defaultValue="alex"
//               className="h-[38px] w-[285px] appearance-none rounded-[9px] border border-[#08b486] bg-white px-3 pr-9 text-[13px] font-medium text-slate-800 outline-none"
//             >
//               <option value="alex">Alex Chen (MEMBER)</option>
//               <option value="maya">Maya Patel (MEMBER)</option>
//               <option value="john">John Smith (STAFF)</option>
//             </select>

//             <ChevronDown
//               size={15}
//               className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
//             />
//           </div>

//           {/* Role Badge */}
//           <span className="hidden rounded-[6px] bg-[#e9f4ff] px-2.5 py-1.5 text-[11px] font-bold text-[#2187dd] md:inline-block">
//             MEMBER 
//           </span>
//         </div>
//       </div>
//     </header>
//   );
// }