import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import LedgerCkb from "@linkdesu/hw-app-ckb";

let lckb: LedgerCkb | null = null;

export async function getLedgerCkb(): Promise<LedgerCkb> {
  if (!lckb) {
    let transport;
    try {
      transport = await TransportWebHID.create();
    } catch (_) {
      console.warn('Failed to connect with WebHID, trying WebUSB...');
      transport = await TransportWebUSB.create();
    }
    lckb = new LedgerCkb(transport);
  }
  return lckb;
}
