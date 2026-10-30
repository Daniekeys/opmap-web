"use client";

import { useState } from "react";
import { CampaignForm, type FormStart } from "./campaign-form";
import { SegmentPicker } from "./segment-picker";

// The campaign screen opens on the buyer segment cards. Picking one (or
// describing your own buyer) opens the form, where it can be edited and
// places chosen.
export function NewCampaign({ workspaceId, slug }: { workspaceId: string; slug: string }) {
  const [step, setStep] = useState<{ form: false } | { form: true; start: FormStart; own: string }>({ form: false });

  if (step.form) {
    return (
      <CampaignForm workspaceId={workspaceId} slug={slug} start={step.start} ownName={step.own} onBack={() => setStep({ form: false })} />
    );
  }
  return (
    <SegmentPicker
      workspaceId={workspaceId}
      slug={slug}
      onPick={(segment, setId) => setStep({ form: true, start: { segment, setId }, own: "" })}
      onOwn={(own) => setStep({ form: true, start: null, own })}
    />
  );
}
