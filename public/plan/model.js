// Shared funnel model for /plan (deck) and /plan/text. Mirrored in scripts/build-plan-xlsx.py.
// Leads come from channels -> each channel has its own qualification rate ->
// qualified leads close either via agency exclusives (commission split, capped by supply)
// or on the parsed IS24 catalogue (B2C fee only, rare: those listings are CRM leftovers).
function computeScenario(data, key) {
  const sc = data.scenarios[key];
  const d = sc.drivers;
  const ue = data.unitEconomics;
  const n = data.months.length;
  const rate = Object.fromEntries(data.channels.map(c => [c.key, c.qualifiedRate]));
  const blendedAgencyDeal = ue.pctRental * ue.rentalSplitEUR + (1 - ue.pctRental) * ue.saleSplitEUR;
  const furniturePerDeal = (ue.furnitureAvgTicketEUR || 0) * (ue.furnitureCommissionPct || 0);

  const rows = [];
  let prevDeals = 0;
  let cumWarmAgencies = 0; // agencies onboarded via warm catalogue-listing touch, added on top of cold-BD ramp
  for (let i = 0; i < n; i++) {
    const coldAgencies = d.activeAgencies[i];
    const effectiveAgencies = coldAgencies + cumWarmAgencies;
    const signups = {
      paid: (d.paidSpend[i] / d.cpc) * d.paidSignupRate,
      community: d.communitySignups[i],
      seo: d.seoVisits[i] * d.seoSignupRate,
      agencies: effectiveAgencies * d.agencyVisitsPerAgency * d.agencySignupRate,
    };
    const qualifiedBy = {
      paid: signups.paid * rate.paid,
      community: signups.community * rate.community,
      seo: signups.seo * rate.seo,
      agencies: signups.agencies * rate.agencies,
      partners: d.partners[i] * d.leadsPerPartner * rate.partners,
      referral: prevDeals * d.referralPerDeal * rate.referral,
    };
    const totalSignups = Object.values(signups).reduce((a, b) => a + b, 0) + d.partners[i] * d.leadsPerPartner;
    const qualified = Object.values(qualifiedBy).reduce((a, b) => a + b, 0);
    const agencyDeals = Math.round(Math.min(qualified * d.qualToAgencyDeal, effectiveAgencies * d.dealsCapPerAgency[i]));
    const selfDeals = Math.round(qualified * d.qualToSelfDeal);
    const feeDeals = selfDeals + Math.round(agencyDeals * ue.feeShareOnAgencyDeals);
    const revenueAgency = agencyDeals * blendedAgencyDeal;
    const furnitureRevenue = Math.round((agencyDeals + selfDeals) * furniturePerDeal);
    const revenue = Math.round(revenueAgency + feeDeals * ue.b2cFeeEUR + d.upsells[i] + furnitureRevenue);
    const marketing = d.paidSpend[i];
    const bdCommission = Math.round(revenueAgency * (ue.bdCommissionOnAgencyRevenue || 0));
    const opex = sc.costs.reduce((s, r) => s + r.vals[i], 0) + bdCommission;
    const cost = marketing + opex;
    prevDeals = agencyDeals + selfDeals;
    // warm touch: a share of this month's catalogue self-deals converts their listing agency into a partner, live from next month
    const newWarmAgencies = Math.round(selfDeals * (d.catalogAgencyConversionRate || 0));
    cumWarmAgencies += newWarmAgencies;
    rows.push({
      month: data.months[i],
      signups: Math.round(totalSignups),
      qualified: Math.round(qualified),
      qualifiedBy,
      coldAgencies, warmAgencies: cumWarmAgencies, effectiveAgencies, newWarmAgencies,
      agencyDeals, selfDeals, feeDeals,
      revenue, marketing, opex, cost, bdCommission, furnitureRevenue,
      ebitda: revenue - cost,
    });
  }

  let cash = data.meta.reserveEUR, minCash = cash, breakeven = null;
  rows.forEach(r => {
    cash += r.ebitda; minCash = Math.min(minCash, cash);
    if (breakeven === null && r.ebitda >= 0) breakeven = r.month;
  });
  const sum = k => rows.reduce((s, r) => s + r[k], 0);
  const yearQualified = sum('qualified');
  const yearDeals = sum('agencyDeals') + sum('selfDeals');
  const yearMarketing = sum('marketing');
  return {
    label: sc.label, rows,
    year: {
      revenue: sum('revenue'), cost: sum('cost'), ebitda: sum('ebitda'),
      marketing: yearMarketing, qualified: yearQualified, deals: yearDeals,
      agencyDeals: sum('agencyDeals'), selfDeals: sum('selfDeals'),
      cacPerQualified: yearQualified ? Math.round(yearMarketing / yearQualified) : null,
      cacPerDeal: yearDeals ? Math.round(yearMarketing / yearDeals) : null,
      blendedAgencyDeal: Math.round(blendedAgencyDeal),
      bdCommission: sum('bdCommission'),
      furnitureRevenue: sum('furnitureRevenue'),
      warmAgenciesAdded: sum('newWarmAgencies'),
      warmAgenciesEndOfYear: rows.length ? rows[rows.length - 1].warmAgencies : 0,
      coldAgenciesEndOfYear: rows.length ? rows[rows.length - 1].coldAgencies : 0,
    },
    breakeven, minCash: Math.round(minCash), endCash: Math.round(cash),
  };
}
