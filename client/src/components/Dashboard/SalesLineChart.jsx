import { useEffect } from 'react';
import { useState } from 'react';
import { Chart } from 'react-google-charts';
import LoadingSpinner from '../Shared/LoadingSpinner';

export const options = {
    title: 'Sales Over Time',
    curveType: 'function',
    legend: { position: 'bottom' },
    series: [{ color: '#F43F5E' }],
};

const SalesLineChart = ({ data }) => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {

        setTimeout(() => {
            setLoading(false)
        }, 500);

    }, [])


    return (
        <>

            {
                loading ?
                    (<LoadingSpinner smallHeight></LoadingSpinner>)
                    :
                    (
                        data.length > 1 ? 
                        <Chart chartType="LineChart" width="100%" data={data} options={options} /> : 
                        
                        <>
                            <LoadingSpinner smallHeight></LoadingSpinner>
                            <p className='text-center'>No data available</p>
                        </>
                    )
            }


        </>
    );
};

export default SalesLineChart;
