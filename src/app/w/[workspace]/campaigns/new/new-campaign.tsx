"use client";

import { useState } from "react";
import { CampaignForm, type FormStart } from "./campaign-form";
import { SegmentPicker } from "./segment-picker";

// The campaign screen opens on the buyer segment cards. Picking one (or
// "type your own") opens the form, where it can be edited and places chosen.
export function NewCampaign({ workspaceId, slug }: { workspaceId: string; slug: string }) {
  const [step, setStep] = useState<{ form: false } | { form: true; start: FormStart }>({ form: false });

  if (step.form) {
    return <CampaignForm workspaceId={workspaceId} slug={slug} start={step.start} onBack={() => setStep({ form: false })} />;
  }
  return (
    <SegmentPicker
      workspaceId={workspaceId}
      slug={slug}
      onPick={(segment, setId) => setStep({ form: true, start: { segment, setId } })}
      onOwn={() => setStep({ form: true, start: null })}
    />
  );
}
