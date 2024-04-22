import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-paginate',
  templateUrl: './paginate.component.html',
  styleUrls: ['./paginate.component.css']
})
export class PaginateComponent {
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() currentPage: number = 1;
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  onPageChange(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.calculateTotalPages()) {
      this.currentPage = pageNumber;
      this.pageChange.emit(this.currentPage);
    }
  }

  calculateTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

}
