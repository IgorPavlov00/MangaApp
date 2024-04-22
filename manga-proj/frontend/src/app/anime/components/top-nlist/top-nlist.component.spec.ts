import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNListComponent } from './top-nlist.component';

describe('TopNListComponent', () => {
  let component: TopNListComponent;
  let fixture: ComponentFixture<TopNListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopNListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopNListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
