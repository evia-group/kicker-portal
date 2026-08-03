import { Component } from '@angular/core';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { RoomMapComponent } from '../../shared/components/room-map/room-map.component';
import { RoomInformationComponent } from '../../shared/components/room-information/room-information.component';

@Component({
  selector: 'app-interactive-map',
  templateUrl: './interactive-map.component.html',
  styleUrls: ['./interactive-map.component.scss'],
  imports: [MatTabGroup, MatTab, RoomMapComponent, RoomInformationComponent],
})
export class InteractiveMapComponent {}
