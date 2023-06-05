import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-two-selections',
  templateUrl: './two-selections.component.html',
  styleUrls: ['./two-selections.component.scss'],
})
export class TwoSelectionsComponent implements OnInit, OnDestroy {
  @Input()
  formGroupName;

  @Input()
  firstPlayerControl: FormControl;

  @Input()
  secondPlayerControl: FormControl;

  @Input()
  firstPlayerOptions;

  @Input()
  secondPlayerOptions;

  @Input()
  displayWithFunction;

  @Input()
  placeholderText: string;

  @Input()
  labelText: string;

  breakpointObserverSubscription: Subscription;

  showButton = false;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.breakpointObserverSubscription = this.breakpointObserver
      .observe(Breakpoints.XSmall)
      .subscribe((result) => {
        this.showButton = result.matches;
        console.log(result);
      });
  }

  ngOnDestroy(): void {
    if (this.breakpointObserverSubscription) {
      this.breakpointObserverSubscription.unsubscribe();
    }
  }
}
