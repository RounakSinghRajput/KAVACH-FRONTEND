export interface SlamLoco {
  sno: number;
  loco: number;
  locoType: string;   // ✅ add this
  make: string;
  contract: string;
  version: string;
  locoBrakeType: string;
  locoManufacturer: string;
  locoOwningZone: string;
  locoOwningDivision: string;
  locoOwningShed: string;
  locoOfferedInstallation: string;
  installationCompleted: string;
  preCommissioningPcc: string;
  finalTestingCommissioning: string;
  remarks: string;
}