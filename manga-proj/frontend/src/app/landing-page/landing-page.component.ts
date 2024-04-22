import {Component, ElementRef, Renderer2, ViewChild} from '@angular/core';
import {Router, RouterModule} from "@angular/router";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  @ViewChild('leftElement') leftElement!: ElementRef;
  @ViewChild('rightElement') rightElement!: ElementRef;
  @ViewChild('containerElement') containerElement!: ElementRef;

  constructor(private renderer: Renderer2,private router:Router) {
  }

  ngAfterViewInit() {
    this.renderer.listen(this.leftElement.nativeElement, 'mouseenter', () => {
      this.renderer.addClass(this.containerElement.nativeElement, 'hover-left');
    });

    this.renderer.listen(this.leftElement.nativeElement, 'mouseleave', () => {
      this.renderer.removeClass(this.containerElement.nativeElement, 'hover-left');
    });

    this.renderer.listen(this.rightElement.nativeElement, 'mouseenter', () => {
      this.renderer.addClass(this.containerElement.nativeElement, 'hover-right');
    });

    this.renderer.listen(this.rightElement.nativeElement, 'mouseleave', () => {
      this.renderer.removeClass(this.containerElement.nativeElement, 'hover-right');
    });
  }


}
