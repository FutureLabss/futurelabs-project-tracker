"use client";

import { useState } from "react";
import MemberHeader from "./MemberHeader";
import MemberSummaryCards from "./MemberSummaryCards";
import MemberTaskSection from "./MemberTaskSection";
import MemberWorkTabs from "./MemberWorkTabs";




export default function MemberPage() {
  const [activeTab, setActiveTab] = useState<"my-work" | "team">("my-work");

  return (
    <main >

      <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-8">
        <MemberHeader   />

        <div className="mt-7">
          <MemberSummaryCards />
        </div>

        <div className="mt-6">
          <MemberWorkTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="mt-5">
          <MemberTaskSection />
        </div>
      </div>
    </main>
  );
}