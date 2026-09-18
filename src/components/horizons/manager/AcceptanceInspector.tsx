// import {
//   X,
//   ClipboardCheck,
//   Folder,
//   User,
//   CheckCircle2,
// } from "lucide-react";

// import type { AcceptanceItem } from "../../../data/mockData";

// type AcceptanceInspectorProps = {
//   item: AcceptanceItem;
//   onClose: () => void;
// };

// export default function AcceptanceInspector({
//   item,
//   onClose,
// }: AcceptanceInspectorProps) {
//   return (
//     <>
//       {/* =====================================================
//           DARK BACKDROP
//       ====================================================== */}

//       <div
//         className="fixed inset-0 z-40 bg-black/50"
//         onClick={onClose}
//       />

//       {/* =====================================================
//           RIGHT-SIDE INSPECTOR
//       ====================================================== */}

//       <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
//         {/* ===================================================
//             HEADER
//         ==================================================== */}

//         <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
//           <div className="flex items-center gap-3">
//             <h2 className="text-xl font-bold text-gray-950">
//               Deliverable Review Inspector
//             </h2>

//             <span className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-500">
//               GATE-{item.id}
//             </span>
//           </div>

//           <button
//             onClick={onClose}
//             className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
//             aria-label="Close inspector"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         {/* ===================================================
//             CONTENT
//         ==================================================== */}

//         <div className="space-y-5 p-6">

//           {/* =================================================
//               DELIVERABLE INFORMATION
//           ================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

//             {/* Title + status */}

//             <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-950">
//                   {item.deliverable}
//                 </h1>

//                 <p className="mt-2 text-base text-gray-400">
//                   {item.description}
//                 </p>
//               </div>

//               <span className="shrink-0 rounded-md bg-purple-50 px-3 py-2 text-xs font-bold text-purple-600">
//                 {item.status}
//               </span>
//             </div>

//             {/* Divider */}

//             <div className="my-5 border-t border-gray-100" />

//             {/* =================================================
//                 DETAILS
//             ================================================== */}

//             <div className="divide-y divide-gray-100">

//               {/* Project */}

//               <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
//                 <div className="flex w-48 items-center gap-2 text-sm font-medium text-gray-400">
//                   <Folder size={18} />

//                   Project
//                 </div>

//                 <div className="flex items-center gap-2 font-medium text-emerald-500">
//                   <Folder size={18} />

//                   {item.project}
//                 </div>
//               </div>

//               {/* Submitted by */}

//               <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
//                 <div className="flex w-48 items-center gap-2 text-sm font-medium text-gray-400">
//                   <User size={18} />

//                   Submitted By
//                 </div>

//                 <span className="font-semibold text-emerald-500">
//                   {item.submittedBy}
//                 </span>
//               </div>

//               {/* Complexity */}

//               <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
//                 <div className="w-48 text-sm font-medium text-gray-400">
//                   Complexity Weight
//                 </div>

//                 <span className="rounded-md border border-emerald-400 px-2.5 py-1 text-xs font-bold text-emerald-500">
//                   {item.complexity} ({item.points}{" "}
//                   {item.points === 1 ? "PT" : "PTS"})
//                 </span>
//               </div>

//               {/* Status */}

//               <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
//                 <div className="w-48 text-sm font-medium text-gray-400">
//                   Gate Status
//                 </div>

//                 <span className="font-semibold text-purple-600">
//                   {item.status}
//                 </span>
//               </div>
//             </div>
//           </section>

//           {/* =================================================
//               ACTIONS
//           ================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
//             <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
//               Operational State Actions
//             </p>

//             <div className="flex flex-wrap gap-3">

//               <button
//                 className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-600"
//               >
//                 <ClipboardCheck size={18} />

//                 Review Deliverable
//               </button>

//               <button
//                 className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100"
//               >
//                 <CheckCircle2 size={18} />

//                 Accept Deliverable
//               </button>
//             </div>
//           </section>

//           {/* =================================================
//               REVIEW INFORMATION
//           ================================================== */}

//           <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//             <div className="flex items-center gap-3">
//               <ClipboardCheck
//                 size={22}
//                 className="text-purple-500"
//               />

//               <h3 className="text-lg font-bold text-gray-950">
//                 Deliverable Artifact & Review Gate History
//               </h3>
//             </div>

//             <div className="mt-5 rounded-lg bg-gray-50 p-4">
//               <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//                 Submission Notes
//               </p>

//               <p className="mt-2 text-sm text-gray-700">
//                 {item.description}
//               </p>
//             </div>
//           </section>

//           {/* =================================================
//               REVIEW FOOTER
//           ================================================== */}

//           <div className="border-t border-gray-200 pt-5">
//             <p className="text-xs leading-5 text-gray-400">
//               This deliverable is currently awaiting manager
//               verification. Review the submitted work before
//               accepting or requesting rework.
//             </p>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }