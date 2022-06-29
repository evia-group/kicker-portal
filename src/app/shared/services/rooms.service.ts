import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IRoom } from '../interfaces/room.interface';
import { DefaultRoomData } from '../models/default.model';

@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  private roomSource = new BehaviorSubject<IRoom>(DefaultRoomData);
  public roomInformation = this.roomSource.asObservable();

  public updateRoom(data: IRoom): void {
    this.roomSource.next(data);
  }
}
