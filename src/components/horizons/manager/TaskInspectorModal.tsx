// // src/components/horizons/manager/TaskInspectorModal.tsx

// import {
//   CalendarDays,
//   CheckCircle2,
//   CircleAlert,
//   Clock3,
//   Folder,
//   History,
//   Send,
//   Sparkles,
//   User,
//   X,
// } from "lucide-react";

// import type { AttentionItem } from "../../../data/mockData";

// type TaskInspectorModalProps = {
//   item: AttentionItem | null;
//   onClose: () => void;
// };

// export default function TaskInspectorModal({
//   item,
//   onClose,
// }: TaskInspectorModalProps) {
//   // If no task has been selected, don't render anything.
//   if (!item) {
//     return null;
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex">
//       {/* =====================================================
//           DARK BACKDROP
//           ===================================================== */}

//       <div
//         className="absolute inset-0 bg-black/60"
//         onClick={onClose}
//       />

//       {/* =====================================================
//           RIGHT-SIDE INSPECTOR
//           ===================================================== */}

//       <aside className="relative ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
//         {/* =====================================================
//             HEADER
//             ===================================================== */}

//         <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-5">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <div className="flex items-center gap-3">
//                 <h2 className="text-2xl font-bold text-gray-950">
//                   Task Diagnostic & Lifecycle Inspector
//                 </h2>

//                 <span className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-500">
//                   TASK-{item.id}
//                 </span>
//               </div>
//             </div>

//             <button
//               onClick={onClose}
//               className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
//               aria-label="Close inspector"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* =====================================================
//             TASK INFORMATION
//             ===================================================== */}

//         <div className="space-y-5 p-6">
//           <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
//             {/* Task title */}

//             <div className="flex items-start justify-between gap-5 border-b border-gray-200 p-6">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-950">
//                   {item.title}
//                 </h1>

//                 <p className="mt-2 text-base leading-6 text-gray-400">
//                   {item.description}
//                 </p>
//               </div>

//               <span className="shrink-0 rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-500">
//                 IN PROGRESS
//               </span>
//             </div>

//             {/* Task metadata */}

//             <div>
//               {/* Project */}

//               <div className="flex items-center border-b border-gray-200 px-6 py-4">
//                 <span className="w-52 text-sm font-medium text-gray-400">
//                   Project
//                 </span>

//                 <span className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
//                   <Folder size={18} />

//                   {item.project}
//                 </span>
//               </div>

//               {/* Assigned owner */}

//               <div className="flex items-center border-b border-gray-200 px-6 py-4">
//                 <span className="w-52 text-sm font-medium text-gray-400">
//                   Assigned Owner
//                 </span>

//                 <span className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
//                   <User size={18} />

//                   {item.assignee}
//                 </span>
//               </div>

//               {/* Complexity */}

//               <div className="flex items-center border-b border-gray-200 px-6 py-4">
//                 <span className="w-52 text-sm font-medium text-gray-400">
//                   Complexity Weight
//                 </span>

//                 <span className="rounded-md border border-blue-400 px-3 py-1 text-xs font-bold text-blue-500">
//                   MID (2 PTS)
//                 </span>
//               </div>

//               {/* Due date */}

//               <div className="flex items-center border-b border-gray-200 px-6 py-4">
//                 <span className="w-52 text-sm font-medium text-gray-400">
//                   Target Due Date
//                 </span>

//                 <span className="flex items-center gap-2 text-sm font-bold text-red-500">
//                   2026-08-25

//                   <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] text-white">
//                     OVERDUE
//                   </span>
//                 </span>
//               </div>

//               {/* Created timestamp */}

//               <div className="flex items-center px-6 py-4">
//                 <span className="w-52 text-sm font-medium text-gray-400">
//                   Created Timestamp
//                 </span>

//                 <span className="text-sm text-gray-500">
//                   8/12/2026, 10:00:00 AM
//                 </span>
//               </div>
//             </div>
//           </section>

//           {/* =====================================================
//               OPERATIONAL STATE ACTIONS
//               ===================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <div className="mb-4 flex items-center gap-2">
//               <CircleAlert size={19} className="text-gray-400" />

//               <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
//                 Operational State Actions
//               </h3>
//             </div>

//             <div className="flex flex-wrap gap-3">
//               <button
//                 className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
//                 onClick={() => {
//                   console.log("Submit for acceptance gate:", item);
//                 }}
//               >
//                 <Send size={17} />

//                 Submit for Acceptance Gate
//               </button>

//               <button
//                 className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-100"
//                 onClick={() => {
//                   console.log("Raise blocker:", item);
//                 }}
//               >
//                 <CircleAlert size={17} />

//                 Raise Blocker
//               </button>

//               <button
//                 className="inline-flex items-center gap-2 rounded-lg border border-orange-400 bg-white px-5 py-3 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
//                 onClick={() => {
//                   console.log("Reschedule due date:", item);
//                 }}
//               >
//                 <CalendarDays size={17} />

//                 Reschedule Due Date...
//               </button>
//             </div>
//           </section>

//           {/* =====================================================
//               AGING WIP INDICATOR
//               ===================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <Clock3 size={20} className="text-blue-500" />

//                 <h3 className="text-lg font-bold text-gray-950">
//                   Aging WIP Indicator
//                 </h3>
//               </div>

//               <span className="rounded-md bg-red-500 px-3 py-2 text-xs font-bold text-white">
//                 10 / 6 WORKING DAYS
//               </span>
//             </div>

//             <div className="mt-4 h-2 rounded-full bg-gray-200">
//               <div className="h-2 w-full rounded-full bg-red-500" />
//             </div>

//             <p className="mt-4 text-sm leading-6 text-gray-400">
//               Complexity threshold: 6 days (MID complexity). Task is in
//               progress longer than expected; consider unblocking or scope
//               adjustment.
//             </p>
//           </section>

//           {/* =====================================================
//               SCHEDULE SLIP AUDIT LOG
//               ===================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-bold text-gray-950">
//                 Schedule Slip Audit Log (2)
//               </h3>

//               <span className="text-sm text-gray-400">
//                 Due date revisions with mandatory recorded reasons
//               </span>
//             </div>

//             <div className="mt-5 overflow-x-auto">
//               <table className="w-full min-w-[650px] text-left">
//                 <thead>
//                   <tr className="border-b border-gray-200">
//                     <th className="px-3 py-3 text-sm font-bold text-gray-900">
//                       Timestamp
//                     </th>

//                     <th className="px-3 py-3 text-sm font-bold text-gray-900">
//                       Adjustment
//                     </th>

//                     <th className="px-3 py-3 text-sm font-bold text-gray-900">
//                       Actor
//                     </th>

//                     <th className="px-3 py-3 text-sm font-bold text-gray-900">
//                       Mandatory Recorded Reason
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   <tr className="border-b border-gray-100">
//                     <td className="px-3 py-4 text-sm text-gray-500">
//                       8/24/2026
//                     </td>

//                     <td className="px-3 py-4">
//                       <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500">
//                         2026-08-25 → 2026-08-25
//                       </span>
//                     </td>

//                     <td className="px-3 py-4 text-sm font-semibold text-gray-800">
//                       Alex Chen
//                     </td>

//                     <td className="px-3 py-4 text-sm text-orange-600">
//                       Finalized carrier failover test cases
//                     </td>
//                   </tr>

//                   <tr>
//                     <td className="px-3 py-4 text-sm text-gray-500">
//                       8/20/2026
//                     </td>

//                     <td className="px-3 py-4">
//                       <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500">
//                         2026-08-22 → 2026-08-25
//                       </span>
//                     </td>

//                     <td className="px-3 py-4 text-sm font-semibold text-gray-800">
//                       Alex Chen
//                     </td>

//                     <td className="px-3 py-4 text-sm text-orange-600">
//                       Twilio webhook provider API rate limit investigation
//                       required extra time
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           {/* =====================================================
//               IMMUTABLE LIFECYCLE ACTIVITY STREAM
//               ===================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <History size={21} className="text-emerald-500" />

//                 <h3 className="text-lg font-bold text-gray-950">
//                   Immutable Lifecycle Activity Stream
//                 </h3>
//               </div>

//               <span className="text-sm text-gray-400">
//                 4 total event(s)
//               </span>
//             </div>

//             <div className="relative mt-6">
//               {/* Vertical timeline */}

//               <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-emerald-200" />

//               <div className="space-y-8">
//                 {/* Event 1 */}

//                 <div className="relative flex gap-5">
//                   <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
//                     <CalendarDays size={16} />
//                   </div>

//                   <div>
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h4 className="font-bold text-gray-900">
//                         Due Date Slipped
//                       </h4>

//                       <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-500">
//                         ALEX CHEN
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-gray-400">
//                       8/24/2026, 5:00:00 PM
//                     </p>

//                     <p className="mt-1 text-sm font-medium text-gray-700">
//                       2026-08-25 → 2026-08-25
//                     </p>

//                     <p className="mt-1 text-sm text-orange-500">
//                       Note: Finalized carrier failover test cases
//                     </p>
//                   </div>
//                 </div>

//                 {/* Event 2 */}

//                 <div className="relative flex gap-5">
//                   <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
//                     <CalendarDays size={16} />
//                   </div>

//                   <div>
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h4 className="font-bold text-gray-900">
//                         Due Date Slipped
//                       </h4>

//                       <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-500">
//                         ALEX CHEN
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-gray-400">
//                       8/20/2026, 12:00:00 PM
//                     </p>

//                     <p className="mt-1 text-sm font-medium text-gray-700">
//                       2026-08-22 → 2026-08-25
//                     </p>

//                     <p className="mt-1 text-sm text-orange-500">
//                       Note: Twilio webhook provider API rate limit
//                       investigation required extra time
//                     </p>
//                   </div>
//                 </div>

//                 {/* Event 3 */}

//                 <div className="relative flex gap-5">
//                   <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
//                     <History size={16} />
//                   </div>

//                   <div>
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h4 className="font-bold text-gray-900">
//                         Status Transition
//                       </h4>

//                       <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-500">
//                         ALEX CHEN
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-gray-400">
//                       8/18/2026, 11:00:00 AM
//                     </p>

//                     <p className="mt-1 text-sm font-medium text-gray-700">
//                       not_started → in_progress
//                     </p>
//                   </div>
//                 </div>

//                 {/* Event 4 */}

//                 <div className="relative flex gap-5">
//                   <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
//                     <Sparkles size={16} />
//                   </div>

//                   <div>
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h4 className="font-bold text-gray-900">
//                         Task Initialized
//                       </h4>

//                       <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-500">
//                         DAVID KIM
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-gray-400">
//                       8/12/2026, 10:00:00 AM
//                     </p>

//                     <p className="mt-1 text-sm font-semibold text-gray-800">
//                       {item.title}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* =====================================================
//               CLOSE BUTTON
//               ===================================================== */}

//           <div className="flex justify-end pb-5">
//             <button
//               onClick={onClose}
//               className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
//             >
//               <CheckCircle2 size={17} />

//               Close Inspector
//             </button>
//           </div>
//         </div>
//       </aside>
//     </div>
//   );
// }