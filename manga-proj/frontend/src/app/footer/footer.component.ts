import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import {ViewportScroller} from "@angular/common";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Output() scrollToTopEvent = new EventEmitter<void>();

  constructor() { }

  ngAfterViewInit() {
    // Hack: Scrolls to top of Page after page view initialized
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }
  scrollToTop() {
    console.log('Scroll to top button clicked');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.scrollToTopEvent.emit();
  }


}
