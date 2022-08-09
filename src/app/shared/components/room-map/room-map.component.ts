import { Component, Input } from '@angular/core';
import * as room from '../../models/wallgrabenData.model';
import { RoomsService } from '../../services/rooms.service';
import { IRoom } from '../../interfaces/room.interface';

@Component({
  selector: 'app-room-map',
  templateUrl: '../../../../assets/svg/am-wallgraben.svg',
  styleUrls: ['./room-map.component.scss'],
})
export class RoomMapComponent {
  @Input() locations = '';

  public test: IRoom[] = room.wallgrabenData;

  private selectedRoomId: number | undefined;

  constructor(private roomService: RoomsService) {}

  private static getIdFromTarget(target: EventTarget | null): number {
    return Number(target['id']) - 1 || 0;
  }

  public hightlight(event: MouseEvent): void {
    const id = RoomMapComponent.getIdFromTarget(event.target);

    if (event.type === 'mouseleave') {
      this.test[id].hover = false;
    } else if (event.type === 'mouseenter') {
      this.test[id].hover = true;
    }
  }

  public selectRoom(event: MouseEvent): void {
    const id = RoomMapComponent.getIdFromTarget(event.target);
    if (this.selectedRoomId === id) {
      this.test[id].selected = false;
      this.selectedRoomId = undefined;
    } else {
      if (this.selectedRoomId !== undefined) {
        this.test[this.selectedRoomId].selected = false;
      }
      this.test[id].selected = true;
      this.selectedRoomId = id;
      this.roomService.updateRoom(this.test[id]);
    }
  }
}
