import { createBrowserRouter } from 'react-router';
import { CheckoutProvider } from './context/CheckoutContext';
import { CheckoutLayout } from './components/CheckoutLayout';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import { Step4 } from './components/Step4';
import { Confirmation } from './components/Confirmation';

const LayoutWithProvider = () => {
  return (
    <CheckoutProvider>
      <CheckoutLayout />
    </CheckoutProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LayoutWithProvider,
    children: [
      {
        index: true,
        Component: Step1
      },
      {
        path: 'step1',
        Component: Step1
      },
      {
        path: 'step2',
        Component: Step2
      },
      {
        path: 'step3',
        Component: Step3
      },
      {
        path: 'step4',
        Component: Step4
      },
      {
        path: 'confirmation',
        Component: Confirmation
      }
    ]
  }
], {
  basename: '/Cpfigmatest'
});
