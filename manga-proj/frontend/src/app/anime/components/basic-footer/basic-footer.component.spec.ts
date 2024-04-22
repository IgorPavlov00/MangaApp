import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicFooterComponent } from './basic-footer.component';

describe('BasicFooterComponent', () => {
  let component: BasicFooterComponent;
  let fixture: ComponentFixture<BasicFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicFooterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
