
import LoadingSpinner from '../../../components/Shared/LoadingSpinner';
import AdminStatistics from '../Admin/AdminStatistics';
import GuestStatistics from '../Guest/GuestStatistics';
import HostStatistics from '../Host/HostStatistics';
import useRole from './../../../hooks/useRole';

const Statistics = () => {

    const [role, isLoading] = useRole();


    if (isLoading) return <LoadingSpinner></LoadingSpinner>
    return (
        <>
            {role === 'admin' && <AdminStatistics></AdminStatistics>}
            {role === 'host' && <HostStatistics></HostStatistics>}
            {role === 'guest' && <GuestStatistics></GuestStatistics>}
        </>
    );
};

export default Statistics;