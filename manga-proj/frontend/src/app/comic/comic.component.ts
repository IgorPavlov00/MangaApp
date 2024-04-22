import { Component } from '@angular/core';
import {LoadingService} from "../LoadingService";

interface Icons {
  [key: string]: string;
}

@Component({
  selector: 'app-comic',
  templateUrl: './comic.component.html',
  styleUrls: ['./comic.component.css']
})
export class ComicComponent {
  isDropdownOpen: boolean = false;
  dropDownName: string = "Account settings";

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onItemClick(itemName: string) {
    console.log('Clicked on item:', itemName);
    // You can add functionality here based on which item is clicked
  }
  // Other methods and variables
}



