import { AfterViewInit, Directive, OnInit, Renderer2 } from '@angular/core';
import { MatLegacyTabNav as MatTabNav } from '@angular/material/legacy-tabs';

@Directive({
  selector: '[appMatTabScroll]',
})
export class MatTabScrollDirective implements OnInit, AfterViewInit {
  private tabListContainer;
  private tabList;
  private previousButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;

  constructor(private matTabNav: MatTabNav, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.tabListContainer = this.matTabNav._tabListContainer.nativeElement;
    if (!this.tabListContainer) {
      throw new Error('No TabListContainer found!');
    }
    this.tabList = this.matTabNav._tabList.nativeElement;
    if (!this.tabList) {
      throw new Error('No TabList found!');
    }
    this.renderer.setStyle(this.tabListContainer, 'overflow-x', 'scroll');
    this.renderer.setStyle(this.tabListContainer, '-ms-overflow-style', 'none');
    this.renderer.setStyle(this.tabListContainer, 'scrollbar-width', 'none');
    const style = this.renderer.createElement('style');
    this.renderer.appendChild(
      style,
      this.renderer.createText(
        '.mat-tab-link-container::-webkit-scrollbar { display: none; }'
      )
    );
    this.renderer.appendChild(this.tabListContainer, style);
    this.tabListContainer.addEventListener('scroll', () => {
      this.toggleButtons();
    });
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', (event) =>
      this.handleWindowResize(event)
    );
    const nav = document.querySelector('.mat-tab-nav-bar');
    this.previousButton = this.createButton('before');
    this.previousButton.addEventListener('click', () => {
      const scrollX = Math.max(
        0,
        this.tabListContainer.scrollLeft - this.getSlideDistance() / 3
      );
      this.scrollToX(scrollX);
    });
    nav.insertBefore(this.previousButton, nav.firstChild);

    this.nextButton = this.createButton('after');
    this.nextButton.addEventListener('click', () => {
      const scrollX = Math.min(
        this.getMaxScroll(),
        this.tabListContainer.scrollLeft + this.getSlideDistance() / 3
      );
      this.scrollToX(scrollX);
    });
    nav.appendChild(this.nextButton);

    this.toggleButtons();
    this.handleWindowResize();
  }

  createButton(className: string): HTMLButtonElement {
    const oldButton = document.querySelector(
      `.mat-tab-header-pagination-${className}`
    );
    const newButton = document.createElement('button');
    oldButton.classList.forEach((buttonClass) => {
      newButton.classList.add(buttonClass);
    });
    oldButton.remove();
    newButton.setAttribute('type', 'button');
    const arrow = document.createElement('div');
    arrow.classList.add('mat-tab-header-pagination-chevron');
    newButton.appendChild(arrow);
    return newButton;
  }

  scrollToX(scrollX: number) {
    this.tabListContainer.scrollTo({
      top: 0,
      left: scrollX,
      behavior: 'smooth',
    });
    this.toggleButtons();
  }

  getSlideDistance() {
    const rect = this.tabListContainer.getBoundingClientRect();
    return rect.width - rect.left;
  }

  toggleButtons() {
    const maxScroll = this.getMaxScroll();
    if (this.tabListContainer.scrollLeft <= 0) {
      this.enableButton(this.nextButton);
      this.disableButton(this.previousButton);
    } else if (this.tabListContainer.scrollLeft >= maxScroll) {
      this.enableButton(this.previousButton);
      this.disableButton(this.nextButton);
    } else {
      this.enableButton(this.previousButton);
      this.enableButton(this.nextButton);
    }
  }

  getMaxScroll() {
    return this.tabList.offsetWidth - this.tabListContainer.offsetWidth;
  }

  disableButton(button: HTMLButtonElement) {
    button.disabled = true;
    button.classList.add('mat-tab-header-pagination-disabled');
  }

  enableButton(button: HTMLButtonElement) {
    button.disabled = false;
    button.classList.remove('mat-tab-header-pagination-disabled');
  }

  hideButtons() {
    this.nextButton.style.display = 'none';
    this.previousButton.style.display = 'none';
  }

  showButtons() {
    this.nextButton.style.display = 'flex';
    this.previousButton.style.display = 'flex';
  }

  handleWindowResize(_event?: UIEvent) {
    const matTabNavWidth =
      document.querySelector('.mat-tab-nav-bar').clientWidth;
    const matTabLinks = this.tabList.querySelectorAll(
      '.mat-tab-links .mat-tab-link'
    );
    let matTabLinksWidth = 0;
    matTabLinks.forEach((matTabLink) => {
      matTabLinksWidth += matTabLink.offsetWidth;
    });
    if (matTabLinksWidth <= matTabNavWidth) {
      this.hideButtons();
    } else {
      this.showButtons();
      this.toggleButtons();
    }
  }
}
