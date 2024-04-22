import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-hero-banner',
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.css']
})
export class HeroBannerComponent implements OnInit {
  slides: HTMLElement[];

  constructor() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
  }
  ngOnInit() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.startSlideshow();
  }

  startSlideshow() {
    let currentSlideIndex = 0;
    this.slides[currentSlideIndex].classList.add('active');

    setInterval(() => {
      this.slides[currentSlideIndex].classList.remove('active');
      currentSlideIndex = (currentSlideIndex + 1) % this.slides.length;
      this.slides[currentSlideIndex].classList.add('active');
    }, 3000); // Set the interval duration in milliseconds (e.g., 3000 for 3 seconds)
  }
}
