import { IRoom } from '../interfaces/room.interface';

export const DefaultRoomData: IRoom = {
  id: '0',
  hover: false,
  selected: false,
  information: {
    location: 'Keine Auswahl',
    number: '0',
    name: 'Keine Auswahl',
    icon: 'location_searching'
  }
};
