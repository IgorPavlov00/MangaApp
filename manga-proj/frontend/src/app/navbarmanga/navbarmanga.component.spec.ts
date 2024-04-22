import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarmangaComponent } from './navbarmanga.component';

describe('NavbarmangaComponent', () => {
  let component: NavbarmangaComponent;
  let fixture: ComponentFixture<NavbarmangaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavbarmangaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarmangaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
