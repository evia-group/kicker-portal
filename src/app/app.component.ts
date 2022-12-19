import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { getDatabase, onValue, ref } from '@angular/fire/database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  kickerStatus = false;
  constructor(translate: TranslateService) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('de');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('de');
  }

  ngOnInit() {
    onValue(ref(getDatabase(), '/Kicker'), (snapshot) => {
      this.kickerStatus = snapshot.val().status || false;
    });
  }
}
