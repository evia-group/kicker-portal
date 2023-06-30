import { Directive, OnInit } from '@angular/core';
import { MatTabNav } from '@angular/material/tabs';
import { fromEvent, pairwise, switchMap, takeUntil, tap } from 'rxjs';

@Directive({
  selector: '[appMatTabScroll]',
})
export class MatTabScrollDirective implements OnInit {
  private tabListContainer;
  private tabList;
  private currentTabListTransition: string;
  private tabListMaxScroll: number;

  constructor(private matTabNav: MatTabNav) {}

  ngOnInit(): void {
    this.tabListContainer = this.matTabNav._tabListContainer.nativeElement;
    if (!this.tabListContainer) {
      throw new Error('No TabListContainer found!');
    }
    this.tabList = this.matTabNav._tabList.nativeElement;
    if (!this.tabList) {
      throw new Error('No TabList found!');
    }
    this.matTabNavEventsHandler();
  }

  private matTabNavEventsHandler() {
    fromEvent(this.tabListContainer, 'touchstart')
      .pipe(
        tap(() => {
          this.currentTabListTransition = this.tabList.style.transition;
          this.tabList.style.transition = 'none';
          this.tabListMaxScroll =
            -1 * (this.tabList.offsetWidth - this.tabListContainer.offsetWidth);
        }),
        switchMap(() => {
          return fromEvent(this.tabListContainer, 'touchmove').pipe(
            takeUntil(
              fromEvent(this.tabListContainer, 'touchend').pipe(
                tap(() => {
                  this.tabList.style.transition = this.currentTabListTransition;
                })
              )
            ),
            pairwise()
          );
        })
      )
      .subscribe((res: [any, any]) => {
        const rect = this.tabListContainer.getBoundingClientRect();

        const previousX = res[0].touches[0].clientX - rect.left;

        const currentX = res[1].touches[0].clientX - rect.left;

        this.scrollMatTabNav(currentX - previousX);
      });
  }

  private scrollMatTabNav(scrollX: number) {
    if (!this.tabList || !this.tabListMaxScroll) {
      return;
    }
    const currentTransform = this.tabList.style.transform;
    let currentScroll: number;
    if (currentTransform && currentTransform.indexOf('translateX') > -1) {
      let tmp = currentTransform.substring('translateX('.length);
      tmp = tmp.substring(0, tmp.length - 'px'.length);
      currentScroll = parseInt(tmp, 10);
    } else {
      currentScroll = 0;
    }
    let newScroll = currentScroll + scrollX;
    if (newScroll > 0) {
      newScroll = 0;
    }
    if (newScroll < this.tabListMaxScroll) {
      newScroll = this.tabListMaxScroll;
    }
    this.tabList.style.transform = `translateX(${newScroll}px`;
  }
}
