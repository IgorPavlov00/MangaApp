import { Component } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent {
  searchForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      search: [''],
      genre: [''],
      chapter: [''],
      status: ['']
    });
  }

  search() {
    // Implement search logic using form values
    // const searchValue = this.searchForm.get('search').value;
    // const genreValue = this.searchForm.get('genre').value;
    // const chapterValue = this.searchForm.get('chapter').value;
    // const statusValue = this.searchForm.get('status').value;

    // Perform filtering based on searchValue, genreValue, chapterValue, and statusValue
  }
}
