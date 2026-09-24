export interface Tag {
  id: number;
  tagNo: string;
  tagType: string;
  latitude: number;
  longitude: number;
  roadNo: string;
  section: string;

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
}
