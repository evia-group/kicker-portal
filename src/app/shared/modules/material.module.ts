import {NgModule} from '@angular/core';

import {LayoutModule} from '@angular/cdk/layout';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatDividerModule} from '@angular/material/divider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';

@NgModule({
  imports: [
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  exports: [
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatSnackBarModule
  ]
})
export class MaterialModule {
}
