// app/app/_components/app-header.tsx
//
// Rendered once in app/app/layout.tsx, above {children} -- this is what
// makes it appear "on every screen" (Change 2) without touching each
// page individually. /app/campagnes additionally renders LeadQuotaStat a
// second time, inline beside its campaign counter -- that's an explicit
// extra placement the brief asks for there specifically, not duplicated
// logic; this component owns the global instance and the warning banner.

'use client';

import { useEffect, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { fetchAgencyPlanUsage, type AgencyPlanUsage } from '@/lib/mock-data';
import { LeadQuotaStat } from './lead-quota-stat';

export function AppHeader() {
  const [planUsage, setPlanUsage] = useState<AgencyPlanUsage | null>(null);

  useEffect(() => {
    fetchAgencyPlanUsage().then(setPlanUsage);
  }, []);

  if (!planUsage) return null;

  const atLimit =
    planUsage.max_leads_per_month !== null &&
    planUsage.leads_delivered_this_period >= planUsage.max_leads_per_month;

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="app-header">
        <LeadQuotaStat planUsage={planUsage} />
      </div>
      {atLimit && (
        <p className="quota-atteint-banner">
          Quota atteint. Vos campagnes continuent de tourner, mais aucun nouveau prospect ne vous
          sera livré avant le renouvellement.
        </p>
      )}
    </Tooltip.Provider>
  );
}
