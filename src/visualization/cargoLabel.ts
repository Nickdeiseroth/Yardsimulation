import { TRAFFIC_TYPE_LABELS } from '../simulation/modes/scenario1';
import { TRAFFIC_LABELS_2 } from '../simulation/modes/scenario2';

/**
 * `CargoUnit.reference` trägt je nach aktivem Modus eine andere
 * Verkehrstyp-Kennung (z.B. "sgut" in Szenario 1, "sge" in Szenario 2).
 * Diese kombinierte Tabelle übersetzt beide in lesbare Labels, damit
 * Tooltips/Auswertungen immer zeigen, welcher Art eine Ladeeinheit
 * zuzuordnen ist - unabhängig davon, welcher Modus sie erzeugt hat.
 */
const ALL_LABELS: Record<string, string> = { ...TRAFFIC_TYPE_LABELS, ...TRAFFIC_LABELS_2 };

export function cargoReferenceLabel(reference: string | undefined): string | undefined {
  if (!reference) return undefined;
  return ALL_LABELS[reference] ?? reference;
}
