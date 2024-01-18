import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[appMatTabScroll]',
})
export class MatTabScrollDirective implements OnInit, AfterViewInit, OnDestroy {
  private tabListContainer: HTMLElement;
  private tabList: HTMLElement;
  private tabListInner: HTMLElement;
  private matTabNavNativeElement: HTMLElement;
  private lastClickedLinkElement: HTMLElement;
  private previousButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private maxScroll: number;
  private subscriptions: Subscription[] = [];
  private isMobileDevice = false;

  constructor(private matTabNav: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.isMobileDevice =
      ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
      window.screen.width < 768;
  }

  ngAfterViewInit(): void {
    this.matTabNavNativeElement = this.matTabNav.nativeElement;
    this.tabListContainer = this.matTabNavNativeElement.querySelector(
      '.mat-mdc-tab-link-container'
    );
    if (!this.tabListContainer) {
      throw new Error('No TabListContainer found!');
    }
    this.tabList =
      this.matTabNavNativeElement.querySelector('.mat-mdc-tab-list');
    if (!this.tabList) {
      throw new Error('No TabList found!');
    }
    this.tabListInner =
      this.matTabNavNativeElement.querySelector('.mat-mdc-tab-links');
    if (!this.tabListInner) {
      throw new Error('No TabListInner found!');
    }
    this.renderer.setStyle(this.tabList, 'overflow-x', 'scroll');
    this.renderer.setStyle(this.tabList, '-ms-overflow-style', 'none');
    this.renderer.setStyle(this.tabList, 'scrollbar-width', 'none');
    const style = this.renderer.createElement('style');
    this.renderer.appendChild(
      style,
      this.renderer.createText(
        '.mat-mdc-tab-list::-webkit-scrollbar { display: none; }'
      )
    );
    this.renderer.appendChild(
      style,
      this.renderer.createText(
        '.mat-mdc-tab-list { transform: none !important }'
      )
    );
    this.renderer.appendChild(this.tabList, style);
    this.tabList.addEventListener('scroll', () => {
      this.toggleButtons();
    });

    const matTabLinks =
      this.matTabNavNativeElement.querySelectorAll('.mat-mdc-tab-link');
    matTabLinks.forEach((matTabLink: HTMLElement) => {
      this.subscriptions.push(
        fromEvent(matTabLink, 'click').subscribe(() => {
          this.lastClickedLinkElement = matTabLink;
          this.scrollLastClickedNavIntoView();
        })
      );
    });
    window.addEventListener('resize', () => this.handleWindowResize());
    this.previousButton = this.createButton('before');
    this.previousButton.addEventListener('click', () => {
      const scrollX = Math.max(
        0,
        this.tabList.scrollLeft - this.tabList.offsetWidth / 3
      );
      this.scrollToX(scrollX);
    });
    this.matTabNavNativeElement.insertBefore(
      this.previousButton,
      this.matTabNavNativeElement.firstChild
    );

    this.nextButton = this.createButton('after');
    this.nextButton.addEventListener('click', () => {
      const scrollX = Math.min(
        this.maxScroll,
        this.tabList.scrollLeft + this.tabList.offsetWidth / 3
      );
      this.scrollToX(scrollX);
    });
    this.matTabNavNativeElement.appendChild(this.nextButton);

    this.toggleButtons();
    this.handleWindowResize();
  }

  scrollLastClickedNavIntoView() {
    this.lastClickedLinkElement?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
    });
  }

  setMaxScroll() {
    this.maxScroll = this.tabList.scrollWidth - this.tabList.offsetWidth;
  }

  createButton(className: string): HTMLButtonElement {
    const oldButton = this.matTabNavNativeElement.querySelector(
      `.mat-mdc-tab-header-pagination-${className}`
    );
    const newButton = document.createElement('button');
    oldButton.classList.forEach((buttonClass: string) => {
      newButton.classList.add(buttonClass);
    });
    oldButton.remove();
    newButton.setAttribute('type', 'button');
    const arrow = document.createElement('div');
    arrow.classList.add('mat-mdc-tab-header-pagination-chevron');
    newButton.appendChild(arrow);
    return newButton;
  }

  scrollToX(scrollX: number) {
    this.tabList.scrollTo({
      top: 0,
      left: scrollX,
      behavior: 'smooth',
    });
    this.toggleButtons();
  }

  toggleButtons() {
    if (this.tabList.scrollLeft <= 0) {
      this.enableButton(this.nextButton);
      this.disableButton(this.previousButton);
    } else if (this.tabList.scrollLeft >= this.maxScroll) {
      this.enableButton(this.previousButton);
      this.disableButton(this.nextButton);
    } else {
      this.enableButton(this.previousButton);
      this.enableButton(this.nextButton);
    }
  }

  disableButton(button: HTMLButtonElement) {
    button.disabled = true;
    button.classList.add('mat-mdc-tab-header-pagination-disabled');
  }

  enableButton(button: HTMLButtonElement) {
    button.disabled = false;
    button.classList.remove('mat-mdc-tab-header-pagination-disabled');
  }

  hideButtons() {
    this.nextButton.style.display = 'none';
    this.previousButton.style.display = 'none';
  }

  showButtons() {
    this.nextButton.style.display = 'flex';
    this.previousButton.style.display = 'flex';
  }

  handleWindowResize() {
    if (this.matTabNavNativeElement && this.tabList) {
      this.setMaxScroll();
      const matTabNavWidth = this.matTabNavNativeElement.offsetWidth;
      const matTabListScrollWidth = this.tabList.scrollWidth;
      if (matTabListScrollWidth <= matTabNavWidth || this.isMobileDevice) {
        this.hideButtons();
      } else {
        this.showButtons();
        this.toggleButtons();
      }
      this.scrollLastClickedNavIntoView();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
