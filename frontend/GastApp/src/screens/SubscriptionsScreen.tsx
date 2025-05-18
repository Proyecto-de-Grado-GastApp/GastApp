import { useGastosContext } from '../contexts/GastosContext';
import SubscriptionsList from '../components/SubscriptionsList';


const SubscriptionsScreen = () => {
  const { gastos, setModal, setModificarGasto } = useGastosContext();

  const suscripciones = gastos.filter(g => g.categoria === 'suscripciones');

  return (
    <SubscriptionsList
      gastos={suscripciones}
      setModal={setModal}
      setModificarGasto={setModificarGasto}
    />
  );
};


export default SubscriptionsScreen