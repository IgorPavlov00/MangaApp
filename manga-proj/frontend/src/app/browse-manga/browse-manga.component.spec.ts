import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseMangaComponent } from './browse-manga.component';

describe('BrowseMangaComponent', () => {
  let component: BrowseMangaComponent;
  let fixture: ComponentFixture<BrowseMangaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BrowseMangaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseMangaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
