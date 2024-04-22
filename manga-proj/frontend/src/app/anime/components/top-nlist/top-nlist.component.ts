import {Component, Input, OnInit} from '@angular/core';
import {TopAnimeItem} from "../../model/top-anime-item";
@Component({
  selector: 'app-top-nlist',
  templateUrl: './top-nlist.component.html',
  styleUrls: ['./top-nlist.component.css'],
})
export class TopNListComponent implements OnInit {
  @Input('title') listTitle: string | undefined;
  @Input('list') topAnime!: TopAnimeItem[];
  ngOnInit(): void {
  }
  visibleIndex = 0;
  translateX = 0;

  showPrevious() {
    if (this.visibleIndex > 0) {
      this.visibleIndex--;
      this.translateX += 260;
    }
  }

  showNext() {
    if (this.visibleIndex < this.topAnime.length - 6) {
      this.visibleIndex++;
      this.translateX -= 260;
    }
  }

  




}
