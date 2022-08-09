import { Component } from '@angular/core';
import { IRoom } from '../../interfaces/room.interface';
import { DefaultRoomData } from '../../models/default.model';
import { RoomsService } from '../../services/rooms.service';

@Component({
  selector: 'app-room-information',
  templateUrl: './room-information.component.html',
  styleUrls: ['./room-information.component.scss'],
})
export class RoomInformationComponent {
  public roomInformation: IRoom = DefaultRoomData;

  constructor(private roomService: RoomsService) {
    this.roomService.roomInformation.subscribe((data) => {
      this.roomInformation = data;
    });
  }

  public getSubtitle(): string {
    let subtitle = this.roomInformation.information.name;

    if (this.roomInformation.information.functional) {
      subtitle = `${this.roomInformation.information.name} - ${this.roomInformation.information.functional}`;
    }

    return subtitle;
  }
}
