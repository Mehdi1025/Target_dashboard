export function buildSniperMessage(prenom: string, entreprise: string) {
  return `Re-bonjour ${prenom} ! Tu as vu le point rouge concernant les faiblesses de ${entreprise} ? On règle ça quand ?`;
}

export type SniperTriggerPayload = {
  prenom: string;
  entreprise: string;
  message: string;
};

export const SNIPER_TRIGGER_EVENT = "target-os:sniper-triggered";

export function dispatchSniperTrigger(payload: SniperTriggerPayload) {
  window.dispatchEvent(
    new CustomEvent<SniperTriggerPayload>(SNIPER_TRIGGER_EVENT, { detail: payload })
  );
}
