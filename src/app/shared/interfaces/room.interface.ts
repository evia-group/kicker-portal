interface IRoomInformation {
  location: string;
  number: string;
  name: string;
  employee?: string[];
  icon: string;
  functional?: string;
}

export interface IRoom {
  id: string;
  information: IRoomInformation;
  hover: boolean;
  selected: boolean;
}
