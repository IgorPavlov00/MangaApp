import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-star',
  templateUrl: './star.component.html',
  styleUrls: ['./star.component.css']
})
export class StarComponent {
  @Input() rating: number = 0;
  stars: number[] = [ 1,3,5, 7, 9];
}
