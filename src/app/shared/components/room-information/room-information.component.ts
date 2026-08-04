import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IRoom } from '../../interfaces/room.interface';
import { DefaultRoomData } from '../../models/default.model';
import { RoomsService } from '../../services/rooms.service';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import {
  MatList,
  MatListSubheaderCssMatStyler,
  MatListItem,
} from '@angular/material/list';

@Component({
  selector: 'app-room-information',
  templateUrl: './room-information.component.html',
  styleUrls: ['./room-information.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatCard,
    MatCardHeader,
    MatIcon,
    MatCardAvatar,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatList,
    MatListSubheaderCssMatStyler,
    MatListItem,
  ],
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
