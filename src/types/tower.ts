export interface Tower {
  id: number;
  assetId: string;
  latitude: string;   // comes as string from API
  longitude: string;  // comes as string from API

  station: {
    id: number;
    name: string;
    code: string;

    division: {
      id: number;
      name: string;
      code: string;

      zone: {
        id: number;
        name: string;
        code: string;
      };
    };
  };

  codalLife: string;
  warrantyPeriod: string;
}
